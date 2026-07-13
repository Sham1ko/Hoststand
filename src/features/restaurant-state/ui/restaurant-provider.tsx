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

import type { CreateReservationInput } from "@/features/reservations/model/schemas";
import type { ReservationAction } from "@/features/reservations/model/types";

import {
  createLocalStorageRestaurantRepository,
  type RestaurantRepository,
} from "../api/restaurant-repository";
import {
  applyRestaurantReservationAction,
  createRestaurantTable,
  createRestaurantReservation,
  deleteRestaurantTable,
  type TableDetails,
  type TablePosition,
  updateRestaurantTable,
  updateRestaurantTablePosition,
} from "../model/actions";
import type { DiningTable } from "@/features/floor-plan/model/types";
import type { RestaurantState } from "../model/types";

type RestaurantContextValue = {
  state: RestaurantState;
  setActiveFloorId: (floorId: string) => Promise<void>;
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
  resetDemo: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

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
  const repositoryRef = useRef<RestaurantRepository | null>(null);

  useEffect(() => {
    const repository = createLocalStorageRestaurantRepository(window.localStorage);
    let isMounted = true;

    repositoryRef.current = repository;

    void repository.loadRestaurant().then((nextState) => {
      if (isMounted) setState(nextState);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const saveState = useCallback(async (nextState: RestaurantState) => {
    setState(nextState);
    await repositoryRef.current?.saveRestaurant(nextState);
  }, []);

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

      await saveState(result.state);
      return true;
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

      await saveState(nextState);
      return true;
    },
    [saveState, state],
  );

  const updateTablePosition = useCallback(
    async (tableId: string, position: TablePosition) => {
      if (!state) return false;

      const nextState = updateRestaurantTablePosition(state, tableId, position);

      if (!nextState) return false;

      await saveState(nextState);
      return true;
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

      await saveState(nextState);
      return nextState.tables.at(-1) ?? null;
    },
    [saveState, state],
  );

  const updateTable = useCallback(
    async (tableId: string, details: TableDetails) => {
      if (!state) return false;

      const nextState = updateRestaurantTable(state, tableId, details);

      if (!nextState) return false;

      await saveState(nextState);
      return true;
    },
    [saveState, state],
  );

  const deleteTable = useCallback(
    async (tableId: string) => {
      if (!state) return false;

      const nextState = deleteRestaurantTable(state, tableId);

      if (!nextState) return false;

      await saveState(nextState);
      return true;
    },
    [saveState, state],
  );

  const resetDemo = useCallback(async () => {
    const nextState = await repositoryRef.current?.resetDemo();

    if (nextState) setState(nextState);
  }, []);

  if (!state) return <RestaurantLoadingState />;

  return (
    <RestaurantContext
      value={{
        state,
        setActiveFloorId,
        createReservation,
        applyReservationAction,
        updateTablePosition,
        createTable,
        updateTable,
        deleteTable,
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
