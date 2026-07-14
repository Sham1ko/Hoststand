import {
  deleteRestaurantZone,
  updateRestaurantZone,
} from "@/features/floor-plan-management/model/zone-actions";
import { zonePatchSchema } from "@/entities/zone/model/schemas";
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
  const patch = await parseJsonBody(request, zonePatchSchema);

  if (!patch) return invalidPayloadResponse();

  const { id } = await context.params;
  const result = mutateRestaurant((state) => {
    const currentZone = state.zones.find((zone) => zone.id === id);

    if (!currentZone) return { status: "not_found" };

    const rect = patch.rect ?? currentZone.rect;

    if (!rect) return { status: "conflict" };

    const nextState = updateRestaurantZone(state, id, {
      name: patch.name ?? currentZone.name,
      color: patch.color ?? currentZone.color,
      rect,
    });

    if (!nextState) {
      return { status: "ok", state, data: currentZone };
    }

    const zone = nextState.zones.find((item) => item.id === id);

    if (!zone) return { status: "conflict" };

    return { status: "ok", state: nextState, data: zone };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Zone");
  }

  return Response.json({ data: result.data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = mutateRestaurant((state) => {
    if (!state.zones.some((zone) => zone.id === id)) {
      return { status: "not_found" };
    }

    const nextState = deleteRestaurantZone(state, id);

    if (!nextState) return { status: "conflict" };

    return { status: "ok", state: nextState, data: undefined };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Zone");
  }

  return new Response(null, { status: 204 });
}
