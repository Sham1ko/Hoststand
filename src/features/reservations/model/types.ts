export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type ReservationAction = "complete" | "cancel";

export type ReservationStatusCounts = Record<
  ReservationStatus | "ALL",
  number
>;

export interface Reservation {
  id: string;
  tableId: string;
  guestName: string;
  guestPhone: string;
  guestsCount: number;
  reservationDate: string;
  durationMinutes: number;
  comment?: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface ReservationsResponse {
  data: Reservation[];
  meta: {
    statusCounts: ReservationStatusCounts;
  };
}

export interface ReservationTableReference {
  id: string;
  number: number;
  capacity: number;
  floorId: string;
}

export interface ReservationFloorReference {
  id: string;
  name: string;
}
