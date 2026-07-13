import { createReservationsSeed } from "../data/seed";
import {
  filterReservationsByDate,
  getReservationStatusCounts,
} from "../model/selectors";
import {
  cancelReservation,
  completeReservation,
} from "../model/transitions";
import type {
  ReservationAction,
  ReservationsResponse,
} from "../model/types";

let reservations = createReservationsSeed();

export function getReservationsResponse(date?: Date): ReservationsResponse {
  const data = date
    ? filterReservationsByDate(reservations, date)
    : reservations;

  return {
    data,
    meta: {
      statusCounts: getReservationStatusCounts(data),
    },
  };
}

export function applyReservationAction(
  reservationId: string,
  action: ReservationAction,
) {
  const reservationExists = reservations.some(
    (reservation) => reservation.id === reservationId,
  );

  if (!reservationExists) return "not_found" as const;

  const updatedReservations =
    action === "complete"
      ? completeReservation(reservations, reservationId)
      : cancelReservation(reservations, reservationId);

  if (updatedReservations === reservations) {
    return "invalid_transition" as const;
  }

  reservations = updatedReservations;
  return "updated" as const;
}
