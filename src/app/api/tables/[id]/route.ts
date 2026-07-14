import {
  deleteRestaurantTable,
  type TableDetails,
  updateRestaurantTable,
  updateRestaurantTablePosition,
} from "@/features/floor-plan-management/model/table-actions";
import {
  tablePatchSchema,
  type TablePatchInput,
} from "@/entities/table/model/schemas";
import type { DiningTable } from "@/entities/table/model/types";
import {
  invalidPayloadResponse,
  mutationErrorResponse,
  parseJsonBody,
} from "@/server/restaurant/http";
import { mutateRestaurant } from "@/server/restaurant/store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function hasRequestedDetails(
  table: DiningTable,
  details: TableDetails,
) {
  return (
    table.number === details.number &&
    table.capacity === details.capacity &&
    table.status === details.status &&
    table.layout.w === details.layout.w &&
    table.layout.h === details.layout.h &&
    table.layout.rotation === details.layout.rotation &&
    table.layout.shape === details.layout.shape
  );
}

function hasDetailsPatch(patch: TablePatchInput) {
  return (
    patch.number !== undefined ||
    patch.capacity !== undefined ||
    patch.status !== undefined ||
    patch.layout?.w !== undefined ||
    patch.layout?.h !== undefined ||
    patch.layout?.rotation !== undefined ||
    patch.layout?.shape !== undefined
  );
}

function mergeTableDetails(
  table: DiningTable,
  patch: TablePatchInput,
): TableDetails {
  return {
    number: patch.number ?? table.number,
    capacity: patch.capacity ?? table.capacity,
    status: patch.status ?? table.status,
    layout: {
      w: patch.layout?.w ?? table.layout.w,
      h: patch.layout?.h ?? table.layout.h,
      rotation: patch.layout?.rotation ?? table.layout.rotation,
      shape: patch.layout?.shape ?? table.layout.shape,
    },
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const patch = await parseJsonBody(request, tablePatchSchema);

  if (!patch) return invalidPayloadResponse();

  const { id } = await context.params;
  const result = mutateRestaurant((state) => {
    const currentTable = state.tables.find((table) => table.id === id);

    if (!currentTable) return { status: "not_found" };

    let nextState = state;

    if (hasDetailsPatch(patch)) {
      const details = mergeTableDetails(currentTable, patch);

      if (!hasRequestedDetails(currentTable, details)) {
        const updatedState = updateRestaurantTable(state, id, details);

        if (!updatedState) return { status: "conflict" };

        nextState = updatedState;
      }
    }

    const tableBeforePosition = nextState.tables.find((table) => table.id === id);

    if (!tableBeforePosition) return { status: "conflict" };

    if (patch.layout?.x !== undefined || patch.layout?.y !== undefined) {
      const movedState = updateRestaurantTablePosition(nextState, id, {
        x: patch.layout.x ?? tableBeforePosition.layout.x,
        y: patch.layout.y ?? tableBeforePosition.layout.y,
      });

      if (movedState) nextState = movedState;
    }

    const table = nextState.tables.find((item) => item.id === id);

    if (!table) return { status: "conflict" };

    return { status: "ok", state: nextState, data: table };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Table");
  }

  return Response.json({ data: result.data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const result = mutateRestaurant((state) => {
    if (!state.tables.some((table) => table.id === id)) {
      return { status: "not_found" };
    }

    const nextState = deleteRestaurantTable(state, id);

    if (!nextState) return { status: "conflict" };

    return { status: "ok", state: nextState, data: undefined };
  });

  if (result.status !== "ok") {
    return mutationErrorResponse(result, "Table");
  }

  return new Response(null, { status: 204 });
}
