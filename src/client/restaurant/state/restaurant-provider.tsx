"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { startOfToday } from "date-fns";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FloorStructureInput } from "@/entities/restaurant/model/schemas";
import { deleteRestaurantZone } from "@/entities/restaurant/model/zone-actions";
import { rebindTablesToZones } from "@/entities/restaurant/model/zone-binding";
import type { RestaurantState } from "@/entities/restaurant/model/types";
import type {
  CreateTableInput,
  TablePatchInput,
} from "@/entities/table/model/schemas";
import type { DiningTable } from "@/entities/table/model/types";
import type { CreateZoneInput } from "@/entities/zone/model/schemas";
import type {
  TableZone,
  ZoneDetails,
} from "@/entities/zone/model/types";
import type {
  CreateReservationInput,
  UpdateReservationInput,
} from "@/entities/reservation/model/schemas";
import type { ReservationAction } from "@/entities/reservation/model/types";

import {
  type DataSource,
  DEFAULT_DATA_SOURCE,
  persistDataSource,
  readStoredDataSource,
} from "../api/data-source";
import { createLocalStorageRestaurantRepository } from "../api/local-storage-restaurant-repository";
import {
  createHttpRestaurantRepository,
  type RestaurantRepository,
} from "../api/restaurant-repository";

type RestaurantContextValue = {
  state: RestaurantState;
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  setActiveFloorId: (floorId: string) => Promise<void>;
  reservationDate: Date;
  setReservationDate: (date: Date) => void;
  focusedReservationTableId: string | null;
  setFocusedReservationTableId: (tableId: string | null) => void;
  createReservation: (input: CreateReservationInput) => Promise<boolean>;
  updateReservation: (
    reservationId: string,
    input: UpdateReservationInput,
  ) => Promise<boolean>;
  applyReservationAction: (
    reservationId: string,
    action: ReservationAction,
  ) => Promise<boolean>;
  createTable: (table: CreateTableInput) => Promise<DiningTable | null>;
  updateTable: (tableId: string, patch: TablePatchInput) => Promise<boolean>;
  deleteTable: (tableId: string) => Promise<boolean>;
  createZone: (zone: CreateZoneInput) => Promise<TableZone | null>;
  updateZone: (zoneId: string, details: ZoneDetails) => Promise<boolean>;
  deleteZone: (zoneId: string) => Promise<boolean>;
  saveFloorStructure: (input: FloorStructureInput) => Promise<boolean>;
  resetDemo: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

function replaceEntity<T extends { id: string }>(items: T[], nextItem: T) {
  return items.map((item) => (item.id === nextItem.id ? nextItem : item));
}

function RestaurantLoadingState() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100" aria-busy="true">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <main className="flex min-h-0 flex-1">
        <div className="m-5 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white" />
        <aside className="w-96 shrink-0 border-l border-slate-200 bg-white" />
      </main>
    </div>
  );
}

function RestaurantLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-6 text-center">
      <p className="text-sm font-medium text-slate-800">
        Не удалось загрузить данные ресторана
      </p>
      <Button type="button" variant="outline" onClick={onRetry}>
        <RefreshCw aria-hidden="true" data-icon="inline-start" />
        Повторить
      </Button>
    </div>
  );
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RestaurantState | null>(null);
  const [reservationDate, setReservationDate] = useState(startOfToday);
  const [focusedReservationTableId, setFocusedReservationTableId] =
    useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [dataSource, setDataSourceState] = useState<DataSource | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);
  const repositoryRef = useRef<RestaurantRepository | null>(null);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (dataSource === null) {
      // Client-only read: resolving the stored setting after mount keeps
      // server and first client render identical (the loading skeleton).
      setDataSourceState(readStoredDataSource());
      return;
    }

    const repository =
      dataSource === "mock-api"
        ? createHttpRestaurantRepository()
        : createLocalStorageRestaurantRepository();
    let isMounted = true;

    repositoryRef.current = repository;
    setHasLoadError(false);

    void repository
      .loadRestaurant()
      .then((nextState) => {
        if (isMounted) setState(nextState);
      })
      .catch(() => {
        if (isMounted) setHasLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [loadAttempt, dataSource]);

  const enqueueMutation = useCallback(
    <Result,>(
      mutation: (repository: RestaurantRepository) => Promise<Result>,
    ) => {
      const result = mutationQueueRef.current.then(() => {
        const repository = repositoryRef.current;

        if (!repository) {
          throw new Error("Restaurant repository is not ready");
        }

        return mutation(repository);
      });

      mutationQueueRef.current = result.then(
        () => undefined,
        () => undefined,
      );

      return result;
    },
    [],
  );

  const setDataSource = useCallback(
    (source: DataSource) => {
      if (source === dataSource) return;

      persistDataSource(source);
      setState(null);
      setDataSourceState(source);
    },
    [dataSource],
  );

  const setActiveFloorId = useCallback(
    async (floorId: string) => {
      setState((currentState) => {
        if (
          !currentState?.floors.some(
            (floor) => floor.id === floorId && floor.isActive,
          )
        ) {
          return currentState;
        }

        return { ...currentState, activeFloorId: floorId };
      });

      // Fire-and-forget persistence: floor switching must stay instant, and
      // repositories without saveActiveFloor simply skip it.
      void enqueueMutation(async (repository) => {
        await repository.saveActiveFloor?.(floorId);
      }).catch(() => {});
    },
    [enqueueMutation],
  );

  const createReservation = useCallback(
    async (input: CreateReservationInput) => {
      try {
        const reservation = await enqueueMutation((repository) =>
          repository.createReservation(input),
        );

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                reservations: [...currentState.reservations, reservation],
              }
            : currentState,
        );

        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const applyReservationAction = useCallback(
    async (reservationId: string, action: ReservationAction) => {
      try {
        const reservation = await enqueueMutation((repository) =>
          repository.applyReservationAction(reservationId, action),
        );

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                reservations: replaceEntity(
                  currentState.reservations,
                  reservation,
                ),
              }
            : currentState,
        );

        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const updateReservation = useCallback(
    async (reservationId: string, input: UpdateReservationInput) => {
      try {
        const reservation = await enqueueMutation((repository) =>
          repository.updateReservation(reservationId, input),
        );

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                reservations: replaceEntity(
                  currentState.reservations,
                  reservation,
                ),
              }
            : currentState,
        );

        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const createTable = useCallback(
    async (input: CreateTableInput) => {
      try {
        const table = await enqueueMutation((repository) =>
          repository.createTable(input),
        );

        setState((currentState) =>
          currentState
            ? { ...currentState, tables: [...currentState.tables, table] }
            : currentState,
        );

        return table;
      } catch {
        return null;
      }
    },
    [enqueueMutation],
  );

  const updateTable = useCallback(
    async (tableId: string, patch: TablePatchInput) => {
      try {
        const table = await enqueueMutation((repository) =>
          repository.patchTable(tableId, patch),
        );

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                tables: replaceEntity(currentState.tables, table),
              }
            : currentState,
        );

        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const deleteTable = useCallback(
    async (tableId: string) => {
      try {
        await enqueueMutation((repository) => repository.deleteTable(tableId));

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                tables: currentState.tables.filter(
                  (table) => table.id !== tableId,
                ),
              }
            : currentState,
        );

        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const createZone = useCallback(
    async (input: CreateZoneInput) => {
      try {
        const zone = await enqueueMutation((repository) =>
          repository.createZone(input),
        );

        setState((currentState) => {
          if (!currentState) return currentState;

          const zones = [...currentState.zones, zone];

          return {
            ...currentState,
            zones,
            tables: rebindTablesToZones(zones, currentState.tables),
          };
        });

        return zone;
      } catch {
        return null;
      }
    },
    [enqueueMutation],
  );

  const updateZone = useCallback(
    async (zoneId: string, details: ZoneDetails) => {
      try {
        const zone = await enqueueMutation((repository) =>
          repository.patchZone(zoneId, details),
        );

        setState((currentState) => {
          if (!currentState) return currentState;

          const zones = replaceEntity(currentState.zones, zone);

          return {
            ...currentState,
            zones,
            tables: rebindTablesToZones(zones, currentState.tables),
          };
        });

        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const deleteZone = useCallback(
    async (zoneId: string) => {
      try {
        await enqueueMutation((repository) => repository.deleteZone(zoneId));

        setState((currentState) =>
          currentState
            ? (deleteRestaurantZone(currentState, zoneId) ?? currentState)
            : currentState,
        );

        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const saveFloorStructure = useCallback(
    async (input: FloorStructureInput) => {
      try {
        const nextState = await enqueueMutation((repository) =>
          repository.saveFloorStructure(input),
        );

        setState(nextState);
        return true;
      } catch {
        return false;
      }
    },
    [enqueueMutation],
  );

  const resetDemo = useCallback(async () => {
    try {
      const nextState = await enqueueMutation((repository) =>
        repository.resetDemo(),
      );

      setState(nextState);
    } catch {
      // Preserve the current plan when the active repository is unavailable.
    }
  }, [enqueueMutation]);

  if (hasLoadError) {
    return (
      <RestaurantLoadError
        onRetry={() => setLoadAttempt((currentAttempt) => currentAttempt + 1)}
      />
    );
  }

  if (!state) return <RestaurantLoadingState />;

  return (
    <RestaurantContext
      value={{
        state,
        dataSource: dataSource ?? DEFAULT_DATA_SOURCE,
        setDataSource,
        setActiveFloorId,
        reservationDate,
        setReservationDate,
        focusedReservationTableId,
        setFocusedReservationTableId,
        createReservation,
        updateReservation,
        applyReservationAction,
        createTable,
        updateTable,
        deleteTable,
        createZone,
        updateZone,
        deleteZone,
        saveFloorStructure,
        resetDemo,
      }}
    >
      {children}
    </RestaurantContext>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);

  if (!context) {
    throw new Error("useRestaurant must be used inside RestaurantProvider");
  }

  return context;
}
