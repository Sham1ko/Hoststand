import { parseISO } from "date-fns";

import { createReservationSchema } from "@/features/reservations/model/schemas";
import {
  createReservation,
  getReservationsResponse,
} from "@/features/reservations/server/reservations-store";

export function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");

  return Response.json(
    getReservationsResponse(date ? parseISO(date) : undefined),
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;
  const result = createReservationSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: "Invalid reservation data" },
      { status: 400 },
    );
  }

  const reservation = createReservation(result.data);

  return Response.json({ data: reservation }, { status: 201 });
}
