import { updateRestaurantFloorStructure } from "@/entities/restaurant/model/floor-structure-actions";
import { floorStructureInputSchema } from "@/entities/restaurant/model/schemas";
import {
  invalidPayloadResponse,
  mutationErrorResponse,
  parseJsonBody,
} from "@/server/restaurant/http";
import { getRestaurant, mutateRestaurant } from "@/server/restaurant/store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ data: getRestaurant() });
}

export async function PATCH(request: Request) {
  const input = await parseJsonBody(request, floorStructureInputSchema);

  if (!input) return invalidPayloadResponse();

  const result = mutateRestaurant((state) => {
    const nextState = updateRestaurantFloorStructure(state, input);

    if (!nextState) return { status: "conflict" };

    return { status: "ok", state: nextState, data: nextState };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Floor structure");
  }

  return Response.json({ data: result.data });
}
