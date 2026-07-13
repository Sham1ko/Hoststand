import {
  cancelReservation,
  completeReservation,
  confirmReservation,
} from "@/features/reservations/model/transitions";
import { getBoundedTablePosition } from "@/features/floor-plan/model/geometry";
import type { DiningTable } from "@/features/floor-plan/model/types";
import type {
  CreateReservationInput,
} from "@/features/reservations/model/schemas";
import type { ReservationAction } from "@/features/reservations/model/types";

import type { RestaurantState } from "./types";

export type TablePosition = Pick<DiningTable["layout"], "x" | "y">;
export type TableDetails = Pick<
  DiningTable,
  "number" | "capacity" | "status"
> & {
  layout: Pick<DiningTable["layout"], "w" | "h" | "rotation" | "shape">;
};

const reservationActionHandlers = {
  confirm: confirmReservation,
  complete: completeReservation,
  cancel: cancelReservation,
} satisfies Record<ReservationAction, typeof confirmReservation>;

export function createRestaurantReservation(
  state: RestaurantState,
  input: CreateReservationInput,
  id: string,
  createdAt: string,
) {
  if (!state.tables.some((table) => table.id === input.tableId)) {
    return null;
  }

  const reservation = {
    ...input,
    id,
    status: "PENDING" as const,
    createdAt,
  };

  return {
    state: {
      ...state,
      reservations: [...state.reservations, reservation],
    },
    reservation,
  };
}

export function applyRestaurantReservationAction(
  state: RestaurantState,
  reservationId: string,
  action: ReservationAction,
) {
  const reservations = reservationActionHandlers[action](
    state.reservations,
    reservationId,
  );

  if (reservations === state.reservations) return null;

  return {
    ...state,
    reservations,
  };
}

export function updateRestaurantTablePosition(
  state: RestaurantState,
  tableId: string,
  position: TablePosition,
) {
  const table = state.tables.find((item) => item.id === tableId);

  if (!table) return null;

  const nextPosition = getBoundedTablePosition(position, table.layout, true);

  if (
    table.layout.x === nextPosition.x &&
    table.layout.y === nextPosition.y
  ) {
    return null;
  }

  return {
    ...state,
    tables: state.tables.map((item) =>
      item.id === tableId
        ? {
            ...item,
            layout: {
              ...item.layout,
              ...nextPosition,
            },
          }
        : item,
    ),
  };
}

function hasValidTableDetails(details: TableDetails) {
  return (
    Number.isInteger(details.number) &&
    details.number > 0 &&
    Number.isInteger(details.capacity) &&
    details.capacity > 0 &&
    Number.isFinite(details.layout.w) &&
    details.layout.w >= 40 &&
    Number.isFinite(details.layout.h) &&
    details.layout.h >= 40 &&
    Number.isFinite(details.layout.rotation)
  );
}

function hasDuplicateTableNumber(
  tables: readonly DiningTable[],
  number: number,
  excludedTableId?: string,
) {
  return tables.some(
    (table) => table.id !== excludedTableId && table.number === number,
  );
}

function hasSameTableDetails(table: DiningTable, nextTable: DiningTable) {
  return (
    table.number === nextTable.number &&
    table.capacity === nextTable.capacity &&
    table.status === nextTable.status &&
    table.layout.x === nextTable.layout.x &&
    table.layout.y === nextTable.layout.y &&
    table.layout.w === nextTable.layout.w &&
    table.layout.h === nextTable.layout.h &&
    table.layout.rotation === nextTable.layout.rotation &&
    table.layout.shape === nextTable.layout.shape
  );
}

export function createRestaurantTable(
  state: RestaurantState,
  table: DiningTable,
) {
  if (
    state.tables.some((item) => item.id === table.id) ||
    hasDuplicateTableNumber(state.tables, table.number) ||
    !state.floors.some((floor) => floor.id === table.floorId && floor.isActive) ||
    !hasValidTableDetails(table)
  ) {
    return null;
  }

  const position = getBoundedTablePosition(table.layout, table.layout, true);

  return {
    ...state,
    tables: [
      ...state.tables,
      {
        ...table,
        layout: {
          ...table.layout,
          ...position,
        },
      },
    ],
  };
}

export function updateRestaurantTable(
  state: RestaurantState,
  tableId: string,
  details: TableDetails,
) {
  const table = state.tables.find((item) => item.id === tableId);

  if (
    !table ||
    hasDuplicateTableNumber(state.tables, details.number, tableId) ||
    !hasValidTableDetails(details)
  ) {
    return null;
  }

  const layout = {
    ...table.layout,
    ...details.layout,
  };
  const position = getBoundedTablePosition(layout, layout, true);
  const nextTable = {
    ...table,
    ...details,
    layout: {
      ...layout,
      ...position,
    },
  };

  if (hasSameTableDetails(table, nextTable)) return null;

  return {
    ...state,
    tables: state.tables.map((item) =>
      item.id === tableId ? nextTable : item,
    ),
  };
}

export function deleteRestaurantTable(
  state: RestaurantState,
  tableId: string,
) {
  if (
    !state.tables.some((table) => table.id === tableId) ||
    state.reservations.some((reservation) => reservation.tableId === tableId)
  ) {
    return null;
  }

  return {
    ...state,
    tables: state.tables.filter((table) => table.id !== tableId),
  };
}
