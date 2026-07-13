import {
  getReservationsResponse,
  resetReservations,
} from "@/features/reservations/server/reservations-store";

export function POST() {
  resetReservations();

  return Response.json(getReservationsResponse());
}
