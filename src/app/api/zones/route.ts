import { createRestaurantZone } from "@/features/restaurant-state/model/actions";
import { createZoneSchema } from "@/features/restaurant-state/model/schemas";
import {
  invalidPayloadResponse,
  mutationErrorResponse,
  parseJsonBody,
} from "@/features/restaurant-state/server/http";
import { mutateRestaurant } from "@/features/restaurant-state/server/restaurant-store";

export async function POST(request: Request) {
  const input = await parseJsonBody(request, createZoneSchema);

  if (!input) return invalidPayloadResponse();

  const zoneId = crypto.randomUUID();
  const result = mutateRestaurant((state) => {
    const nextState = createRestaurantZone(state, { ...input, id: zoneId });

    if (!nextState) return { status: "conflict" };

    const zone = nextState.zones.find((item) => item.id === zoneId);

    if (!zone) return { status: "conflict" };

    return { status: "ok", state: nextState, data: zone };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Zone");
  }

  return Response.json({ data: result.data }, { status: 201 });
}
