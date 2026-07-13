import { createReservationsSeed } from "@/features/reservations/data/seed";

export function GET() {
  return Response.json(createReservationsSeed());
}
