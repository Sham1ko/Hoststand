import {
  cancelReservation,
  completeReservation,
  confirmReservation,
} from "@/features/reservations/model/transitions";
import { getBoundedTablePosition } from "@/features/floor-plan/model/geometry";
import type { DiningTable } from "@/features/floor-plan/model/types";
import type {
  CreateReservationInput,
} from "@/features/reservations/model/schemas";
import type { ReservationAction } from "@/features/reservations/model/types";

import type { RestaurantState } from "./types";

export type TablePosition = Pick<DiningTable["layout"], "x" | "y">;

const reservationActionHandlers = {
  confirm: confirmReservation,
  complete: completeReservation,
  cancel: cancelReservation,
} satisfies Record<ReservationAction, typeof confirmReservation>;

export function createRestaurantReservation(
  state: RestaurantState,
  input: CreateReservationInput,
  id: string,
  createdAt: string,
) {
  if (!state.tables.some((table) => table.id === input.tableId)) {
    return null;
  }

  const reservation = {
    ...input,
    id,
    status: "PENDING" as const,
    createdAt,
  };

  return {
    state: {
      ...state,
      reservations: [...state.reservations, reservation],
    },
    reservation,
  };
}

export function applyRestaurantReservationAction(
  state: RestaurantState,
  reservationId: string,
  action: ReservationAction,
) {
  const reservations = reservationActionHandlers[action](
    state.reservations,
    reservationId,
  );

  if (reservations === state.reservations) return null;

  return {
    ...state,
    reservations,
  };
}

export function updateRestaurantTablePosition(
  state: RestaurantState,
  tableId: string,
  position: TablePosition,
) {
  const table = state.tables.find((item) => item.id === tableId);

  if (!table) return null;

  const nextPosition = getBoundedTablePosition(position, table.layout, true);

  if (
    table.layout.x === nextPosition.x &&
    table.layout.y === nextPosition.y
  ) {
    return null;
  }

  return {
    ...state,
    tables: state.tables.map((item) =>
      item.id === tableId
        ? {
            ...item,
            layout: {
              ...item.layout,
              ...nextPosition,
            },
          }
        : item,
    ),
  };
}
