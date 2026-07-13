import { isSameDay, parseISO } from "date-fns";

import type {
  Reservation,
  ReservationFloorReference,
  ReservationStatus,
  ReservationTableReference,
} from "./types";

export type ReservationStatusCounts = Record<
  ReservationStatus | "ALL",
  number
>;

export type ReservationTableContext = {
  tableNumber: number;
  capacity: number;
  floorName: string;
};

export function filterReservationsByDate(
  reservations: readonly Reservation[],
  date: Date,
) {
  return reservations.filter((reservation) =>
    isSameDay(parseISO(reservation.reservationDate), date),
  );
}

export function filterReservationsByStatus(
  reservations: readonly Reservation[],
  status: ReservationStatus | null,
) {
  if (!status) return [...reservations];
  return reservations.filter((reservation) => reservation.status === status);
}

export function getReservationStatusCounts(
  reservations: readonly Reservation[],
): ReservationStatusCounts {
  const counts: ReservationStatusCounts = {
    ALL: reservations.length,
    PENDING: 0,
    CONFIRMED: 0,
    CANCELLED: 0,
    COMPLETED: 0,
  };

  for (const reservation of reservations) {
    counts[reservation.status] += 1;
  }

  return counts;
}

export function getReservationTableContext(
  tableId: string,
  tables: readonly ReservationTableReference[],
  floors: readonly ReservationFloorReference[],
): ReservationTableContext | null {
  const table = tables.find((item) => item.id === tableId);
  if (!table) return null;

  const floor = floors.find((item) => item.id === table.floorId);
  if (!floor) return null;

  return {
    tableNumber: table.number,
    capacity: table.capacity,
    floorName: floor.name,
  };
}
