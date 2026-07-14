import { createReservationSchema } from "@/entities/reservation/model/schemas";
import { createRestaurantReservation } from "@/features/restaurant/model/reservation-actions";
import {
  invalidPayloadResponse,
  mutationErrorResponse,
  parseJsonBody,
} from "@/server/restaurant/http";
import { mutateRestaurant } from "@/server/restaurant/store";

export async function POST(request: Request) {
  const input = await parseJsonBody(request, createReservationSchema);

  if (!input) return invalidPayloadResponse();

  const reservationId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const result = mutateRestaurant((state) => {
    const created = createRestaurantReservation(
      state,
      input,
      reservationId,
      createdAt,
    );

    if (!created) return { status: "conflict" };

    return {
      status: "ok",
      state: created.state,
      data: created.reservation,
    };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Reservation");
  }

  return Response.json({ data: result.data }, { status: 201 });
}
