import { applyRestaurantReservationAction } from "@/features/restaurant/model/reservation-actions";
import { reservationActionSchema } from "@/entities/reservation/model/schemas";
import {
  invalidPayloadResponse,
  mutationErrorResponse,
  parseJsonBody,
} from "@/server/restaurant/http";
import { mutateRestaurant } from "@/server/restaurant/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const input = await parseJsonBody(request, reservationActionSchema);

  if (!input) return invalidPayloadResponse();

  const { id } = await context.params;
  const result = mutateRestaurant((state) => {
    if (!state.reservations.some((reservation) => reservation.id === id)) {
      return { status: "not_found" };
    }

    const nextState = applyRestaurantReservationAction(state, id, input.action);

    if (!nextState) return { status: "conflict" };

    const reservation = nextState.reservations.find((item) => item.id === id);

    if (!reservation) return { status: "conflict" };

    return { status: "ok", state: nextState, data: reservation };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Reservation");
  }

  return Response.json({ data: result.data });
}
