export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

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
