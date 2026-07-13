import {
  cancelReservation,
  completeReservation,
  confirmReservation,
} from "@/features/reservations/model/transitions";
import {
  getBoundedTablePosition,
  getBoundedZoneRect,
  type Point,
} from "@/features/floor-plan/model/geometry";
import type {
  DiningTable,
  TableZone,
} from "@/features/floor-plan/model/types";
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
export type ZoneDetails = Pick<TableZone, "name" | "color"> & {
  rect: NonNullable<TableZone["rect"]>;
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

function hasValidZoneDetails(details: ZoneDetails) {
  return (
    details.name.trim().length > 0 &&
    /^#[0-9a-f]{6}$/i.test(details.color) &&
    Number.isFinite(details.rect.x) &&
    Number.isFinite(details.rect.y) &&
    Number.isFinite(details.rect.w) &&
    Number.isFinite(details.rect.h)
  );
}

export function createRestaurantZone(
  state: RestaurantState,
  zone: TableZone,
) {
  if (
    !zone.rect ||
    state.zones.some((item) => item.id === zone.id) ||
    !state.floors.some((floor) => floor.id === zone.floorId && floor.isActive) ||
    !hasValidZoneDetails({ ...zone, rect: zone.rect })
  ) {
    return null;
  }

  return {
    ...state,
    zones: [
      ...state.zones,
      {
        ...zone,
        name: zone.name.trim(),
        rect: getBoundedZoneRect(zone.rect, true),
      },
    ],
  };
}

export function updateRestaurantZone(
  state: RestaurantState,
  zoneId: string,
  details: ZoneDetails,
) {
  const zone = state.zones.find((item) => item.id === zoneId);

  if (!zone || !hasValidZoneDetails(details)) return null;

  const nextZone = {
    ...zone,
    name: details.name.trim(),
    color: details.color,
    rect: getBoundedZoneRect(details.rect, true),
  };

  if (
    zone.name === nextZone.name &&
    zone.color === nextZone.color &&
    zone.rect?.x === nextZone.rect.x &&
    zone.rect?.y === nextZone.rect.y &&
    zone.rect?.w === nextZone.rect.w &&
    zone.rect?.h === nextZone.rect.h
  ) {
    return null;
  }

  return {
    ...state,
    zones: state.zones.map((item) => (item.id === zoneId ? nextZone : item)),
  };
}

export function deleteRestaurantZone(state: RestaurantState, zoneId: string) {
  if (!state.zones.some((zone) => zone.id === zoneId)) return null;

  return {
    ...state,
    zones: state.zones.filter((zone) => zone.id !== zoneId),
    tables: state.tables.map((table) =>
      table.zoneId === zoneId ? { ...table, zoneId: undefined } : table,
    ),
  };
}
