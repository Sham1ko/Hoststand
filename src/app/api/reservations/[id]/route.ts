import {
  applyRestaurantReservationAction,
  updateRestaurantReservation,
} from "@/entities/restaurant/model/reservation-actions";
import { reservationMutationSchema } from "@/entities/reservation/model/schemas";
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
  const input = await parseJsonBody(request, reservationMutationSchema);

  if (!input) return invalidPayloadResponse();

  const { id } = await context.params;
  const result = mutateRestaurant((state) => {
    if (!state.reservations.some((reservation) => reservation.id === id)) {
      return { status: "not_found" };
    }

    const update =
      "action" in input
        ? (() => {
            const nextState = applyRestaurantReservationAction(
              state,
              id,
              input.action,
            );

            if (!nextState) return null;

            const reservation = nextState.reservations.find(
              (item) => item.id === id,
            );

            return reservation ? { state: nextState, reservation } : null;
          })()
        : updateRestaurantReservation(state, id, input);

    if (!update) return { status: "conflict" };

    return { status: "ok", state: update.state, data: update.reservation };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Reservation");
  }

  return Response.json({ data: result.data });
}
