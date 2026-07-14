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
import type { RestaurantState } from "@/entities/restaurant/model/types";
import type {
  CreateTableInput,
  TablePatchInput,
} from "@/entities/table/model/schemas";
import type { DiningTable } from "@/entities/table/model/types";
import type { CreateZoneInput } from "@/entities/zone/model/schemas";
import type { TableZone } from "@/entities/zone/model/types";
import type { CreateReservationInput } from "@/entities/reservation/model/schemas";
import type { ReservationAction } from "@/entities/reservation/model/types";

import {
  createHttpRestaurantRepository,
  type RestaurantRepository,
} from "../api/restaurant-repository";
import type { ZoneDetails } from "../model/zone-actions";

type RestaurantContextValue = {
  state: RestaurantState;
  setActiveFloorId: (floorId: string) => Promise<void>;
  reservationDate: Date;
  setReservationDate: (date: Date) => void;
  focusedReservationTableId: string | null;
  setFocusedReservationTableId: (tableId: string | null) => void;
  createReservation: (input: CreateReservationInput) => Promise<boolean>;
  applyReservationAction: (
    reservationId: string,
    action: ReservationAction,
  ) => Promise<boolean>;
  createTable: (table: CreateTableInput) => Promise<DiningTable | null>;
  updateTable: (tableId: string, patch: TablePatchInput) => Promise<boolean>;
  deleteTable: (tableId: string) => Promise<boolean>;
  createZone: (zone: CreateZoneInput) => Promise<TableZone | null>;
  updateZone: (zoneId: string, details: ZoneDetails) => Promise<boolean>;
  updateZoneRect: (
    zoneId: string,
    rect: NonNullable<TableZone["rect"]>,
  ) => Promise<boolean>;
  deleteZone: (zoneId: string) => Promise<boolean>;
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
  const [hasLoadError, setHasLoadError] = useState(false);
  const repositoryRef = useRef<RestaurantRepository | null>(null);
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const repository = createHttpRestaurantRepository();
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
  }, [loadAttempt]);

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

  const setActiveFloorId = useCallback(async (floorId: string) => {
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
  }, []);

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

        setState((currentState) =>
          currentState
            ? { ...currentState, zones: [...currentState.zones, zone] }
            : currentState,
        );

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

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                zones: replaceEntity(currentState.zones, zone),
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

  const updateZoneRect = useCallback(
    async (zoneId: string, rect: NonNullable<TableZone["rect"]>) => {
      try {
        const zone = await enqueueMutation((repository) =>
          repository.patchZone(zoneId, { rect }),
        );

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                zones: replaceEntity(currentState.zones, zone),
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

  const deleteZone = useCallback(
    async (zoneId: string) => {
      try {
        await enqueueMutation((repository) => repository.deleteZone(zoneId));

        setState((currentState) =>
          currentState
            ? {
                ...currentState,
                zones: currentState.zones.filter((zone) => zone.id !== zoneId),
                tables: currentState.tables.map((table) =>
                  table.zoneId === zoneId
                    ? { ...table, zoneId: undefined }
                    : table,
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
        setActiveFloorId,
        reservationDate,
        setReservationDate,
        focusedReservationTableId,
        setFocusedReservationTableId,
        createReservation,
        applyReservationAction,
        createTable,
        updateTable,
        deleteTable,
        createZone,
        updateZone,
        updateZoneRect,
        deleteZone,
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
