import { parseISO } from "date-fns";

import { getReservationsResponse } from "@/features/reservations/server/reservations-store";

export function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");

  return Response.json(
    getReservationsResponse(date ? parseISO(date) : undefined),
  );
}
