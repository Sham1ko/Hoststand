import {
  getBoundedTablePosition,
  type Point,
} from "@/lib/floor-plan/geometry";
import type { RestaurantState } from "@/entities/restaurant/model/types";
import type {
  DiningTable,
  TablePosition,
} from "@/entities/table/model/types";

export type TableDetails = Pick<
  DiningTable,
  "number" | "capacity" | "status"
> & {
  layout: Pick<DiningTable["layout"], "w" | "h" | "rotation" | "shape">;
};

function getZoneIdAtPosition(
  state: RestaurantState,
  floorId: string,
  position: Point,
) {
  return [...state.zones]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .find((zone) => {
      if (!zone.isActive || zone.floorId !== floorId || !zone.rect) {
        return false;
      }

      return (
        position.x >= zone.rect.x &&
        position.x <= zone.rect.x + zone.rect.w &&
        position.y >= zone.rect.y &&
        position.y <= zone.rect.y + zone.rect.h
      );
    })?.id;
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
    table.zoneId === nextTable.zoneId &&
    table.layout.x === nextTable.layout.x &&
    table.layout.y === nextTable.layout.y &&
    table.layout.w === nextTable.layout.w &&
    table.layout.h === nextTable.layout.h &&
    table.layout.rotation === nextTable.layout.rotation &&
    table.layout.shape === nextTable.layout.shape
  );
}

export function updateRestaurantTablePosition(
  state: RestaurantState,
  tableId: string,
  position: TablePosition,
) {
  const table = state.tables.find((item) => item.id === tableId);

  if (!table) return null;

  const nextPosition = getBoundedTablePosition(position, table.layout, true);
  const zoneId = getZoneIdAtPosition(state, table.floorId, nextPosition);

  if (
    table.layout.x === nextPosition.x &&
    table.layout.y === nextPosition.y &&
    table.zoneId === zoneId
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
            zoneId,
          }
        : item,
    ),
  };
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
  const zoneId = getZoneIdAtPosition(state, table.floorId, position);

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
        zoneId,
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
  const zoneId = getZoneIdAtPosition(state, table.floorId, position);
  const nextTable = {
    ...table,
    ...details,
    layout: {
      ...layout,
      ...position,
    },
    zoneId,
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
