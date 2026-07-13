import { createReservationsSeed } from "../data/seed";
import {
  filterReservationsByDate,
  getReservationStatusCounts,
} from "../model/selectors";
import {
  cancelReservation,
  completeReservation,
  confirmReservation,
} from "../model/transitions";
import type { CreateReservationInput } from "../model/schemas";
import type {
  Reservation,
  ReservationAction,
  ReservationsResponse,
} from "../model/types";

const globalStore = globalThis as typeof globalThis & {
  qolayReservations?: Reservation[];
};

function getReservations() {
  globalStore.qolayReservations ??= createReservationsSeed();
  return globalStore.qolayReservations;
}

export function resetReservations() {
  globalStore.qolayReservations = createReservationsSeed();
}

export function createReservation(input: CreateReservationInput) {
  const reservation: Reservation = {
    ...input,
    id: crypto.randomUUID(),
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  globalStore.qolayReservations = [...getReservations(), reservation];

  return reservation;
}

export function getReservationsResponse(date?: Date): ReservationsResponse {
  const reservations = getReservations();
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
  const reservations = getReservations();
  const reservationExists = reservations.some(
    (reservation) => reservation.id === reservationId,
  );

  if (!reservationExists) return "not_found" as const;

  const updatedReservations =
    action === "confirm"
      ? confirmReservation(reservations, reservationId)
      : action === "complete"
        ? completeReservation(reservations, reservationId)
        : cancelReservation(reservations, reservationId);

  if (updatedReservations === reservations) {
    return "invalid_transition" as const;
  }

  globalStore.qolayReservations = updatedReservations;
  return "updated" as const;
}
