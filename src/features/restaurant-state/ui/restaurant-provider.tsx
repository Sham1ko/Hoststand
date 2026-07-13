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

import { createRestaurantSeed } from "@/features/restaurant-state/data/seed";
import type { CreateReservationInput } from "@/features/reservations/model/schemas";
import type { ReservationAction } from "@/features/reservations/model/types";
import type { TableZone } from "@/features/floor-plan/model/types";

import {
  createHttpRestaurantRepository,
  createLocalStorageRestaurantRepository,
  type RestaurantRepository,
} from "../api/restaurant-repository";
import {
  applyRestaurantReservationAction,
  createRestaurantTable,
  createRestaurantReservation,
  createRestaurantZone,
  deleteRestaurantTable,
  deleteRestaurantZone,
  type TableDetails,
  type TablePosition,
  type ZoneDetails,
  updateRestaurantTable,
  updateRestaurantTablePosition,
  updateRestaurantZone,
  updateRestaurantZoneRect,
} from "../model/actions";
import type { DiningTable } from "@/features/floor-plan/model/types";
import type { RestaurantState } from "../model/types";

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
  updateTablePosition: (
    tableId: string,
    position: TablePosition,
  ) => Promise<boolean>;
  createTable: (table: Omit<DiningTable, "id">) => Promise<DiningTable | null>;
  updateTable: (tableId: string, details: TableDetails) => Promise<boolean>;
  deleteTable: (tableId: string) => Promise<boolean>;
  createZone: (zone: Omit<TableZone, "id">) => Promise<TableZone | null>;
  updateZone: (zoneId: string, details: ZoneDetails) => Promise<boolean>;
  updateZoneRect: (
    zoneId: string,
    rect: NonNullable<TableZone["rect"]>,
  ) => Promise<boolean>;
  deleteZone: (zoneId: string) => Promise<boolean>;
  resetDemo: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

function createRestaurantRepository() {
  if (process.env.NEXT_PUBLIC_RESTAURANT_REPOSITORY === "http") {
    return createHttpRestaurantRepository();
  }

  return createLocalStorageRestaurantRepository(window.localStorage);
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

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RestaurantState | null>(null);
  const [reservationDate, setReservationDate] = useState(startOfToday);
  const [focusedReservationTableId, setFocusedReservationTableId] =
    useState<string | null>(null);
  const repositoryRef = useRef<RestaurantRepository | null>(null);

  useEffect(() => {
    const repository = createRestaurantRepository();
    let isMounted = true;

    repositoryRef.current = repository;

    void repository
      .loadRestaurant()
      .then((nextState) => {
        if (isMounted) setState(nextState);
      })
      .catch(() => {
        if (isMounted) setState(createRestaurantSeed());
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveState = useCallback(
    async (nextState: RestaurantState) => {
      const previousState = state;
      const repository = repositoryRef.current;

      if (!previousState || !repository) return false;

      setState(nextState);

      try {
        await repository.saveRestaurant(nextState);
        return true;
      } catch {
        setState((currentState) =>
          currentState === nextState ? previousState : currentState,
        );
        return false;
      }
    },
    [state],
  );

  const setActiveFloorId = useCallback(
    async (floorId: string) => {
      if (!state?.floors.some((floor) => floor.id === floorId && floor.isActive)) {
        return;
      }

      await saveState({ ...state, activeFloorId: floorId });
    },
    [saveState, state],
  );

  const createReservation = useCallback(
    async (input: CreateReservationInput) => {
      if (!state) return false;

      const result = createRestaurantReservation(
        state,
        input,
        crypto.randomUUID(),
        new Date().toISOString(),
      );

      if (!result) return false;

      return saveState(result.state);
    },
    [saveState, state],
  );

  const applyReservationAction = useCallback(
    async (reservationId: string, action: ReservationAction) => {
      if (!state) return false;

      const nextState = applyRestaurantReservationAction(
        state,
        reservationId,
        action,
      );

      if (!nextState) return false;

      return saveState(nextState);
    },
    [saveState, state],
  );

  const updateTablePosition = useCallback(
    async (tableId: string, position: TablePosition) => {
      if (!state) return false;

      const nextState = updateRestaurantTablePosition(state, tableId, position);

      if (!nextState) return false;

      return saveState(nextState);
    },
    [saveState, state],
  );

  const createTable = useCallback(
    async (table: Omit<DiningTable, "id">) => {
      if (!state) return null;

      const nextState = createRestaurantTable(state, {
        ...table,
        id: crypto.randomUUID(),
      });

      if (!nextState) return null;

      if (!(await saveState(nextState))) return null;
      return nextState.tables.at(-1) ?? null;
    },
    [saveState, state],
  );

  const updateTable = useCallback(
    async (tableId: string, details: TableDetails) => {
      if (!state) return false;

      const nextState = updateRestaurantTable(state, tableId, details);

      if (!nextState) return false;

      return saveState(nextState);
    },
    [saveState, state],
  );

  const deleteTable = useCallback(
    async (tableId: string) => {
      if (!state) return false;

      const nextState = deleteRestaurantTable(state, tableId);

      if (!nextState) return false;

      return saveState(nextState);
    },
    [saveState, state],
  );

  const createZone = useCallback(
    async (zone: Omit<TableZone, "id">) => {
      if (!state) return null;

      const nextState = createRestaurantZone(state, {
        ...zone,
        id: crypto.randomUUID(),
      });

      if (!nextState) return null;

      if (!(await saveState(nextState))) return null;
      return nextState.zones.at(-1) ?? null;
    },
    [saveState, state],
  );

  const updateZone = useCallback(
    async (zoneId: string, details: ZoneDetails) => {
      if (!state) return false;

      const nextState = updateRestaurantZone(state, zoneId, details);

      if (!nextState) return false;

      return saveState(nextState);
    },
    [saveState, state],
  );

  const updateZoneRect = useCallback(
    async (zoneId: string, rect: NonNullable<TableZone["rect"]>) => {
      if (!state) return false;

      const nextState = updateRestaurantZoneRect(state, zoneId, rect);

      if (!nextState) return false;

      return saveState(nextState);
    },
    [saveState, state],
  );

  const deleteZone = useCallback(
    async (zoneId: string) => {
      if (!state) return false;

      const nextState = deleteRestaurantZone(state, zoneId);

      if (!nextState) return false;

      await saveState(nextState);
      return true;
    },
    [saveState, state],
  );

  const resetDemo = useCallback(async () => {
    try {
      const nextState = await repositoryRef.current?.resetDemo();

      if (nextState) setState(nextState);
    } catch {
      // Preserve the current plan when the active repository is unavailable.
    }
  }, []);

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
        updateTablePosition,
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
