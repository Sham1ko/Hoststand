import { createRestaurantZone } from "@/features/restaurant/model/zone-actions";
import { createZoneSchema } from "@/features/floor-plan/model/schemas";
import {
  invalidPayloadResponse,
  mutationErrorResponse,
  parseJsonBody,
} from "@/features/restaurant/server/http";
import { mutateRestaurant } from "@/features/restaurant/server/restaurant-store";

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
