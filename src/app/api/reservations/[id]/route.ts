import { parseISO } from "date-fns";

import type { ReservationAction } from "@/features/reservations/model/types";
import {
  applyReservationAction,
  getReservationsResponse,
} from "@/features/reservations/server/reservations-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isReservationAction(value: unknown): value is ReservationAction {
  return value === "complete" || value === "cancel";
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as { action?: unknown };

  if (!isReservationAction(body.action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const result = applyReservationAction(id, body.action);

  if (result === "not_found") {
    return Response.json({ error: "Reservation not found" }, { status: 404 });
  }

  if (result === "invalid_transition") {
    return Response.json({ error: "Action is not allowed" }, { status: 409 });
  }

  const date = new URL(request.url).searchParams.get("date");

  return Response.json(
    getReservationsResponse(date ? parseISO(date) : undefined),
  );
}
