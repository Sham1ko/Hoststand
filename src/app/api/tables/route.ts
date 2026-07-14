import { createRestaurantTable } from "@/entities/restaurant/model/table-actions";
import { createTableSchema } from "@/entities/table/model/schemas";
import {
  invalidPayloadResponse,
  mutationErrorResponse,
  parseJsonBody,
} from "@/server/restaurant/http";
import { mutateRestaurant } from "@/server/restaurant/store";

export async function POST(request: Request) {
  const input = await parseJsonBody(request, createTableSchema);

  if (!input) return invalidPayloadResponse();

  const tableId = crypto.randomUUID();
  const result = mutateRestaurant((state) => {
    const nextState = createRestaurantTable(state, { ...input, id: tableId });

    if (!nextState) return { status: "conflict" };

    const table = nextState.tables.find((item) => item.id === tableId);

    if (!table) return { status: "conflict" };

    return { status: "ok", state: nextState, data: table };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Table");
  }

  return Response.json({ data: result.data }, { status: 201 });
}
