import {
  applyRestaurantReservationAction,
  createRestaurantReservation,
  updateRestaurantReservation,
} from "@/entities/restaurant/model/reservation-actions";
import { updateRestaurantFloorStructure } from "@/entities/restaurant/model/floor-structure-actions";
import {
  createRestaurantTable,
  deleteRestaurantTable,
  type TableDetails,
  updateRestaurantTable,
  updateRestaurantTablePosition,
} from "@/entities/restaurant/model/table-actions";
import {
  createRestaurantZone,
  deleteRestaurantZone,
  updateRestaurantZone,
} from "@/entities/restaurant/model/zone-actions";
import { restaurantStateSchema } from "@/entities/restaurant/model/schemas";
import type { RestaurantState } from "@/entities/restaurant/model/types";
import { createRestaurantSeed } from "@/entities/restaurant/seed/restaurant-seed";
import type { TablePatchInput } from "@/entities/table/model/schemas";
import type { DiningTable } from "@/entities/table/model/types";

import type { RestaurantRepository } from "./restaurant-repository";

export const RESTAURANT_STORAGE_KEY = "qolay.restaurant.v1";

function getStorage() {
  if (typeof window === "undefined") {
    throw new Error("localStorage is not available outside the browser");
  }

  return window.localStorage;
}

function writeState(state: RestaurantState) {
  getStorage().setItem(RESTAURANT_STORAGE_KEY, JSON.stringify(state));
}

function readState(): RestaurantState {
  const raw = getStorage().getItem(RESTAURANT_STORAGE_KEY);

  if (raw !== null) {
    try {
      const parsed = restaurantStateSchema.safeParse(JSON.parse(raw));

      if (parsed.success) return parsed.data;
    } catch {
      // Broken JSON falls through to reseeding below.
    }
  }

  const seed = createRestaurantSeed();

  writeState(seed);

  return seed;
}

// The three helpers below mirror the private ones in
// src/app/api/tables/[id]/route.ts: client code must not import from app,
// and both data sources need identical patch semantics.
function hasRequestedDetails(table: DiningTable, details: TableDetails) {
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

// Inputs are already typed and validated by the forms, and the entity actions
// re-check domain invariants, so unlike the HTTP path there is no extra zod
// parsing here. Multi-tab writes are last-write-wins.
export function createLocalStorageRestaurantRepository(): RestaurantRepository {
  return {
    async loadRestaurant() {
      return readState();
    },
    async createReservation(input) {
      const created = createRestaurantReservation(
        readState(),
        input,
        crypto.randomUUID(),
        new Date().toISOString(),
      );

      if (!created) {
        throw new Error("Reservation conflicts with the restaurant state");
      }

      writeState(created.state);

      return created.reservation;
    },
    async updateReservation(reservationId, input) {
      const updated = updateRestaurantReservation(
        readState(),
        reservationId,
        input,
      );

      if (!updated) {
        throw new Error("Reservation conflicts with the restaurant state");
      }

      writeState(updated.state);

      return updated.reservation;
    },
    async applyReservationAction(reservationId, action) {
      const nextState = applyRestaurantReservationAction(
        readState(),
        reservationId,
        action,
      );

      if (!nextState) {
        throw new Error("Reservation conflicts with the restaurant state");
      }

      const reservation = nextState.reservations.find(
        (item) => item.id === reservationId,
      );

      if (!reservation) throw new Error("Reservation not found");

      writeState(nextState);

      return reservation;
    },
    async createTable(input) {
      const tableId = crypto.randomUUID();
      const nextState = createRestaurantTable(readState(), {
        ...input,
        id: tableId,
      });

      if (!nextState) {
        throw new Error("Table conflicts with the restaurant state");
      }

      const table = nextState.tables.find((item) => item.id === tableId);

      if (!table) throw new Error("Table conflicts with the restaurant state");

      writeState(nextState);

      return table;
    },
    async patchTable(tableId, patch) {
      const state = readState();
      const currentTable = state.tables.find((table) => table.id === tableId);

      if (!currentTable) throw new Error("Table not found");

      let nextState = state;

      if (hasDetailsPatch(patch)) {
        const details = mergeTableDetails(currentTable, patch);

        if (!hasRequestedDetails(currentTable, details)) {
          const updatedState = updateRestaurantTable(state, tableId, details);

          if (!updatedState) {
            throw new Error("Table conflicts with the restaurant state");
          }

          nextState = updatedState;
        }
      }

      const tableBeforePosition = nextState.tables.find(
        (table) => table.id === tableId,
      );

      if (!tableBeforePosition) throw new Error("Table not found");

      if (patch.layout?.x !== undefined || patch.layout?.y !== undefined) {
        const movedState = updateRestaurantTablePosition(nextState, tableId, {
          x: patch.layout.x ?? tableBeforePosition.layout.x,
          y: patch.layout.y ?? tableBeforePosition.layout.y,
        });

        // An unchanged position returns null and is a successful no-op.
        if (movedState) nextState = movedState;
      }

      const table = nextState.tables.find((item) => item.id === tableId);

      if (!table) throw new Error("Table not found");

      writeState(nextState);

      return table;
    },
    async deleteTable(tableId) {
      const state = readState();

      if (!state.tables.some((table) => table.id === tableId)) {
        throw new Error("Table not found");
      }

      const nextState = deleteRestaurantTable(state, tableId);

      if (!nextState) {
        throw new Error("Table conflicts with the restaurant state");
      }

      writeState(nextState);
    },
    async createZone(input) {
      const zoneId = crypto.randomUUID();
      const nextState = createRestaurantZone(readState(), {
        ...input,
        id: zoneId,
      });

      if (!nextState) {
        throw new Error("Zone conflicts with the restaurant state");
      }

      const zone = nextState.zones.find((item) => item.id === zoneId);

      if (!zone) throw new Error("Zone conflicts with the restaurant state");

      writeState(nextState);

      return zone;
    },
    async patchZone(zoneId, patch) {
      const state = readState();
      const currentZone = state.zones.find((zone) => zone.id === zoneId);

      if (!currentZone) throw new Error("Zone not found");

      const rect = patch.rect ?? currentZone.rect;

      if (!rect) throw new Error("Zone conflicts with the restaurant state");

      const nextState = updateRestaurantZone(state, zoneId, {
        name: patch.name ?? currentZone.name,
        color: patch.color ?? currentZone.color,
        rect,
      });

      // Unchanged details return null and are a successful no-op.
      if (!nextState) return currentZone;

      const zone = nextState.zones.find((item) => item.id === zoneId);

      if (!zone) throw new Error("Zone not found");

      writeState(nextState);

      return zone;
    },
    async deleteZone(zoneId) {
      const state = readState();

      if (!state.zones.some((zone) => zone.id === zoneId)) {
        throw new Error("Zone not found");
      }

      const nextState = deleteRestaurantZone(state, zoneId);

      if (!nextState) {
        throw new Error("Zone conflicts with the restaurant state");
      }

      writeState(nextState);
    },
    async saveFloorStructure(input) {
      const nextState = updateRestaurantFloorStructure(readState(), input);

      if (!nextState) {
        throw new Error("Floor structure conflicts with the restaurant state");
      }

      writeState(nextState);

      return nextState;
    },
    async resetDemo() {
      const seed = createRestaurantSeed();

      writeState(seed);

      return seed;
    },
    async saveActiveFloor(floorId) {
      const state = readState();
      const hasActiveFloor = state.floors.some(
        (floor) => floor.id === floorId && floor.isActive,
      );

      if (!hasActiveFloor || state.activeFloorId === floorId) return;

      writeState({ ...state, activeFloorId: floorId });
    },
  };
}
