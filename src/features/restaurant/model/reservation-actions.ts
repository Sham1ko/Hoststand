import {
  cancelReservation,
  completeReservation,
  confirmReservation,
} from "@/features/reservations/model/transitions";
import type { CreateReservationInput } from "@/entities/reservation/model/schemas";
import type { ReservationAction } from "@/entities/reservation/model/types";

import type { RestaurantState } from "./types";

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
