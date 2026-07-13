import {
  RESTAURANT_STORAGE_KEY,
  createLocalStorageRestaurantRepository,
} from "@/features/restaurant-state/api/restaurant-repository";
import { createRestaurantSeed } from "@/features/restaurant-state/data/seed";
import {
  applyRestaurantReservationAction,
  createRestaurantTable,
  createRestaurantReservation,
  deleteRestaurantTable,
  updateRestaurantTablePosition,
  updateRestaurantTable,
} from "@/features/restaurant-state/model/actions";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("creates a complete restaurant seed with valid references", () => {
  const state = createRestaurantSeed();
  const floorIds = new Set(state.floors.map((floor) => floor.id));
  const zoneIds = new Set(state.zones.map((zone) => zone.id));
  const tableIds = new Set(state.tables.map((table) => table.id));

  expect(state.floors).toHaveLength(3);
  expect(state.zones).toHaveLength(6);
  expect(state.tables).toHaveLength(24);
  expect(state.reservations).toHaveLength(6);
  expect(floorIds.has(state.activeFloorId)).toBe(true);

  for (const zone of state.zones) {
    expect(floorIds.has(zone.floorId)).toBe(true);
  }

  for (const table of state.tables) {
    expect(floorIds.has(table.floorId)).toBe(true);
    expect(table.zoneId ? zoneIds.has(table.zoneId) : true).toBe(true);
  }

  for (const reservation of state.reservations) {
    expect(tableIds.has(reservation.tableId)).toBe(true);
  }
});

test("initializes and repairs invalid persisted restaurant state", async () => {
  const storage = new MemoryStorage();
  const repository = createLocalStorageRestaurantRepository(storage);

  const initial = await repository.loadRestaurant();

  expect(initial.tables).toHaveLength(24);
  expect(storage.getItem(RESTAURANT_STORAGE_KEY)).not.toBeNull();

  storage.setItem(RESTAURANT_STORAGE_KEY, "not-json");

  const repaired = await repository.loadRestaurant();

  expect(repaired.zones).toHaveLength(6);

  storage.setItem(
    RESTAURANT_STORAGE_KEY,
    JSON.stringify({ version: 2, data: repaired }),
  );

  const migrated = await repository.loadRestaurant();

  expect(migrated.activeFloorId).toBe("floor-1");
});

test("persists state changes and resets every collection to the demo seed", async () => {
  const storage = new MemoryStorage();
  const repository = createLocalStorageRestaurantRepository(storage);
  const state = createRestaurantSeed();
  const changed = {
    ...state,
    activeFloorId: "floor-2",
    tables: state.tables.slice(1),
    reservations: state.reservations.slice(1),
  };

  await repository.saveRestaurant(changed);

  expect(await repository.loadRestaurant()).toEqual(changed);

  const reset = await repository.resetDemo();

  expect(reset.activeFloorId).toBe("floor-1");
  expect(reset.tables).toHaveLength(24);
  expect(reset.reservations).toHaveLength(6);
  expect(reset.zones).toHaveLength(6);
});

test("creates and transitions reservations through pure restaurant actions", () => {
  const state = createRestaurantSeed();
  const created = createRestaurantReservation(
    state,
    {
      tableId: "table-1",
      guestName: "Новый гость",
      guestPhone: "+77001112233",
      guestsCount: 2,
      reservationDate: "2026-07-13T18:00:00.000Z",
      durationMinutes: 120,
      comment: undefined,
    },
    "reservation-new",
    "2026-07-13T10:00:00.000Z",
  );

  expect(created?.reservation.status).toBe("PENDING");
  expect(created?.state.reservations).toHaveLength(7);
  expect(state.reservations).toHaveLength(6);

  const confirmed = applyRestaurantReservationAction(
    state,
    "reservation-3",
    "confirm",
  );

  expect(
    confirmed?.reservations.find((item) => item.id === "reservation-3")?.status,
  ).toBe("CONFIRMED");
  expect(
    applyRestaurantReservationAction(state, "reservation-3", "complete"),
  ).toBeNull();
});

test("moves only the requested table and normalizes its final position", () => {
  const state = createRestaurantSeed();
  const updated = updateRestaurantTablePosition(state, "table-1", {
    x: 109,
    y: 211,
  });

  expect(
    updated?.tables.find((table) => table.id === "table-1")?.layout,
  ).toMatchObject({ x: 100, y: 220 });
  expect(updated?.tables.find((table) => table.id === "table-2")).toBe(
    state.tables.find((table) => table.id === "table-2"),
  );
  expect(updateRestaurantTablePosition(state, "missing-table", { x: 0, y: 0 })).toBeNull();
});

test("creates, updates, and safely deletes tables through restaurant actions", () => {
  const state = createRestaurantSeed();
  const created = createRestaurantTable(state, {
    id: "table-new",
    number: 25,
    capacity: 4,
    floorId: "floor-1",
    status: "FREE",
    layout: {
      x: 803,
      y: 503,
      w: 150,
      h: 150,
      rotation: 0,
      shape: "square",
    },
  });

  expect(created?.tables).toHaveLength(25);
  expect(created?.tables.at(-1)?.layout).toMatchObject({ x: 800, y: 500 });

  const updated = updateRestaurantTable(created!, "table-new", {
    number: 25,
    capacity: 6,
    status: "BANQUET",
    layout: { w: 180, h: 120, rotation: 15, shape: "rect" },
  });

  expect(updated?.tables.at(-1)).toMatchObject({
    capacity: 6,
    status: "BANQUET",
    layout: { w: 180, h: 120, rotation: 15, shape: "rect" },
  });
  expect(deleteRestaurantTable(updated!, "table-new")?.tables).toHaveLength(24);
  expect(deleteRestaurantTable(state, "table-12")).toBeNull();
});
