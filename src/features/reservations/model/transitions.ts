import type {
  Reservation,
  ReservationStatus,
} from "@/entities/reservation/model/types";

function transitionReservation(
  reservations: Reservation[],
  reservationId: string,
  allowedStatuses: readonly ReservationStatus[],
  nextStatus: ReservationStatus,
) {
  let changed = false;

  const nextReservations = reservations.map((reservation) => {
    if (
      reservation.id !== reservationId ||
      !allowedStatuses.includes(reservation.status)
    ) {
      return reservation;
    }

    changed = true;
    return { ...reservation, status: nextStatus };
  });

  return changed ? nextReservations : reservations;
}

export function completeReservation(
  reservations: Reservation[],
  reservationId: string,
) {
  return transitionReservation(
    reservations,
    reservationId,
    ["CONFIRMED"],
    "COMPLETED",
  );
}

export function confirmReservation(
  reservations: Reservation[],
  reservationId: string,
) {
  return transitionReservation(
    reservations,
    reservationId,
    ["PENDING"],
    "CONFIRMED",
  );
}

export function cancelReservation(
  reservations: Reservation[],
  reservationId: string,
) {
  return transitionReservation(
    reservations,
    reservationId,
    ["PENDING", "CONFIRMED"],
    "CANCELLED",
  );
}
