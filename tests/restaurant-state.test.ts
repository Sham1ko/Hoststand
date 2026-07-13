import {
  RESTAURANT_STORAGE_KEY,
  createHttpRestaurantRepository,
  createLocalStorageRestaurantRepository,
} from "@/features/restaurant-state/api/restaurant-repository";
import { createRestaurantSeed } from "@/features/restaurant-state/data/seed";
import {
  applyRestaurantReservationAction,
  createRestaurantTable,
  createRestaurantReservation,
  createRestaurantZone,
  deleteRestaurantTable,
  deleteRestaurantZone,
  updateRestaurantTablePosition,
  updateRestaurantTable,
  updateRestaurantZone,
} from "@/features/restaurant-state/model/actions";
import {
  GET as GET_RESTAURANT,
  PUT as PUT_RESTAURANT,
} from "@/app/api/restaurant/route";
import { POST as RESET_RESTAURANT } from "@/app/api/restaurant/reset/route";

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

test("uses the HTTP repository contract for load, save, and reset", async () => {
  let remoteState = createRestaurantSeed();
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);

    if (url === "/api/restaurant" && init?.method === "PUT") {
      remoteState = JSON.parse(String(init.body)) as typeof remoteState;
    }

    if (url === "/api/restaurant/reset") {
      remoteState = createRestaurantSeed();
    }

    return Response.json({ data: remoteState });
  };
  const repository = createHttpRestaurantRepository(fetcher);
  const changed = { ...remoteState, activeFloorId: "floor-2" };

  expect(await repository.loadRestaurant()).toEqual(remoteState);

  await repository.saveRestaurant(changed);
  expect(remoteState).toEqual(changed);

  const reset = await repository.resetDemo();
  expect(reset.activeFloorId).toBe("floor-1");
});

test("validates and resets the restaurant API mock", async () => {
  const initial = (await GET_RESTAURANT().json()) as { data: ReturnType<typeof createRestaurantSeed> };
  const changed = { ...initial.data, activeFloorId: "floor-2" };
  const saved = await PUT_RESTAURANT(
    new Request("http://localhost/api/restaurant", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changed),
    }),
  );

  expect(saved.status).toBe(200);
  expect((await GET_RESTAURANT().json()).data.activeFloorId).toBe("floor-2");

  const invalid = await PUT_RESTAURANT(
    new Request("http://localhost/api/restaurant", {
      method: "PUT",
      body: JSON.stringify({}),
    }),
  );

  expect(invalid.status).toBe(400);
  expect((await RESET_RESTAURANT().json()).data.activeFloorId).toBe("floor-1");
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

test("manages zones and updates a table zone after it moves", () => {
  const state = createRestaurantSeed();
  const moved = updateRestaurantTablePosition(state, "table-1", {
    x: 1200,
    y: 200,
  });

  expect(
    moved?.tables.find((table) => table.id === "table-1")?.zoneId,
  ).toBe("zone-window");

  const created = createRestaurantZone(moved!, {
    id: "zone-new",
    floorId: "floor-1",
    name: "Новая зона",
    color: "#0ea5e9",
    sortOrder: 3,
    isActive: true,
    rect: { x: 5, y: 5, w: 101, h: 99 },
  });

  expect(created?.zones.at(-1)?.rect).toEqual({ x: 0, y: 0, w: 120, h: 120 });

  const updated = updateRestaurantZone(created!, "zone-new", {
    name: "Бар",
    color: "#14b8a6",
    rect: { x: 400, y: 400, w: 300, h: 180 },
  });

  expect(updated?.zones.at(-1)).toMatchObject({
    name: "Бар",
    color: "#14b8a6",
    rect: { x: 400, y: 400, w: 300, h: 180 },
  });

  const deleted = deleteRestaurantZone(moved!, "zone-window");

  expect(deleted?.zones).toHaveLength(5);
  expect(
    deleted?.tables.find((table) => table.id === "table-1")?.zoneId,
  ).toBeUndefined();
});
