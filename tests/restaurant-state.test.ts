import { createHttpRestaurantRepository } from "@/features/restaurant/api/restaurant-repository";
import { createRestaurantSeed } from "@/server/restaurant/seed/restaurant-seed";
import {
  applyRestaurantReservationAction,
  createRestaurantReservation,
} from "@/features/restaurant/model/reservation-actions";
import {
  createRestaurantTable,
  deleteRestaurantTable,
  updateRestaurantTablePosition,
  updateRestaurantTable,
} from "@/features/restaurant/model/table-actions";
import {
  createRestaurantZone,
  deleteRestaurantZone,
  updateRestaurantZone,
} from "@/features/restaurant/model/zone-actions";
import {
  GET as GET_RESTAURANT,
} from "@/app/api/restaurant/route";
import { POST as RESET_RESTAURANT } from "@/app/api/restaurant/reset/route";
import { POST as CREATE_RESERVATION } from "@/app/api/reservations/route";
import { PATCH as UPDATE_RESERVATION } from "@/app/api/reservations/[id]/route";
import { POST as CREATE_TABLE } from "@/app/api/tables/route";
import {
  DELETE as DELETE_TABLE,
  PATCH as UPDATE_TABLE,
} from "@/app/api/tables/[id]/route";
import { POST as CREATE_ZONE } from "@/app/api/zones/route";
import {
  DELETE as DELETE_ZONE,
  PATCH as UPDATE_ZONE,
} from "@/app/api/zones/[id]/route";
import * as restaurantRoute from "@/app/api/restaurant/route";

const routeContext = (id: string) => ({ params: Promise.resolve({ id }) });

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

test("uses granular HTTP repository mutations instead of saving the full state", async () => {
  const initial = createRestaurantSeed();
  const updatedTable = {
    ...initial.tables[0],
    capacity: 6,
  };
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, init });

    if (url === "/api/restaurant") {
      return Response.json({ data: initial });
    }

    if (url === "/api/tables/table-1" && init?.method === "PATCH") {
      return Response.json({ data: updatedTable });
    }

    if (url === "/api/restaurant/reset" && init?.method === "POST") {
      return Response.json({ data: initial });
    }

    return new Response(null, { status: 404 });
  };
  const repository = createHttpRestaurantRepository(fetcher);

  expect(await repository.loadRestaurant()).toEqual(initial);

  expect(
    await repository.patchTable("table-1", {
      number: updatedTable.number,
      capacity: updatedTable.capacity,
      status: updatedTable.status,
      layout: {
        w: updatedTable.layout.w,
        h: updatedTable.layout.h,
        rotation: updatedTable.layout.rotation,
        shape: updatedTable.layout.shape,
      },
    }),
  ).toEqual(updatedTable);

  const updateRequest = requests.find(
    (request) => request.url === "/api/tables/table-1",
  );
  const updateBody = JSON.parse(String(updateRequest?.init?.body)) as Record<
    string,
    unknown
  >;

  expect(updateRequest?.init?.method).toBe("PATCH");
  expect(updateBody).toEqual({
    number: 1,
    capacity: 6,
    status: "FREE",
    layout: { w: 120, h: 120, rotation: 0, shape: "square" },
  });
  expect(updateBody).not.toHaveProperty("floors");
  expect(updateBody).not.toHaveProperty("reservations");

  const reset = await repository.resetDemo();
  expect(reset.activeFloorId).toBe("floor-1");
  expect(requests.every((request) => request.init?.method !== "PUT")).toBe(true);
});

test("exposes the restaurant endpoint as read-only bootstrap data", async () => {
  RESET_RESTAURANT();

  const response = GET_RESTAURANT();
  const body = (await response.json()) as {
    data: ReturnType<typeof createRestaurantSeed>;
  };

  expect(response.status).toBe(200);
  expect(body.data.tables).toHaveLength(24);
  expect("PUT" in restaurantRoute).toBe(false);
});

test("mutates tables through resource-specific endpoints", async () => {
  RESET_RESTAURANT();
  const initial = (await GET_RESTAURANT().json()).data;

  const createResponse = await CREATE_TABLE(
    new Request("http://localhost/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
      }),
    }),
  );
  const created = (await createResponse.json()) as {
    data: ReturnType<typeof createRestaurantSeed>["tables"][number];
  };

  expect(createResponse.status).toBe(201);
  expect(created.data).toMatchObject({
    number: 25,
    layout: { x: 800, y: 500 },
  });

  const statusResponse = await UPDATE_TABLE(
    new Request(`http://localhost/api/tables/${created.data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "INACTIVE" }),
    }),
    routeContext(created.data.id),
  );

  expect((await statusResponse.json()).data.status).toBe("INACTIVE");

  const updateResponse = await UPDATE_TABLE(
    new Request(`http://localhost/api/tables/${created.data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: 25,
        capacity: 6,
        status: "BANQUET",
        layout: { w: 180, h: 120, rotation: 15, shape: "rect" },
      }),
    }),
    routeContext(created.data.id),
  );
  const updated = (await updateResponse.json()) as typeof created;

  expect(updated.data).toMatchObject({ capacity: 6, status: "BANQUET" });

  const moveResponse = await UPDATE_TABLE(
    new Request(`http://localhost/api/tables/${created.data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: { x: 109, y: 211 } }),
    }),
    routeContext(created.data.id),
  );
  const moved = (await moveResponse.json()) as typeof created;

  expect(moved.data.layout.x).not.toBe(109);
  expect(moved.data.layout.y).toBe(220);

  const deleteResponse = await DELETE_TABLE(
    new Request(`http://localhost/api/tables/${created.data.id}`, {
      method: "DELETE",
    }),
    routeContext(created.data.id),
  );

  expect(deleteResponse.status).toBe(204);
  const finalState = (await GET_RESTAURANT().json()).data;

  expect(finalState.tables).toHaveLength(24);
  expect(finalState.floors).toEqual(initial.floors);
  expect(finalState.zones).toEqual(initial.zones);
  expect(finalState.reservations).toEqual(initial.reservations);
});

test("mutates zones and reservations without replacing restaurant state", async () => {
  RESET_RESTAURANT();

  const zoneResponse = await CREATE_ZONE(
    new Request("http://localhost/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floorId: "floor-1",
        name: "Новая зона",
        color: "#0ea5e9",
        sortOrder: 3,
        isActive: true,
        rect: { x: 5, y: 5, w: 101, h: 99 },
      }),
    }),
  );
  const createdZone = (await zoneResponse.json()) as {
    data: ReturnType<typeof createRestaurantSeed>["zones"][number];
  };

  expect(zoneResponse.status).toBe(201);
  expect(createdZone.data.rect).toEqual({ x: 0, y: 0, w: 120, h: 120 });

  const updateZoneResponse = await UPDATE_ZONE(
    new Request(`http://localhost/api/zones/${createdZone.data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Бар",
        color: "#14b8a6",
        rect: { x: 400, y: 400, w: 300, h: 180 },
      }),
    }),
    routeContext(createdZone.data.id),
  );

  expect((await updateZoneResponse.json()).data.name).toBe("Бар");

  const moveZoneResponse = await UPDATE_ZONE(
    new Request(`http://localhost/api/zones/${createdZone.data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rect: { x: 600, y: 400, w: 300, h: 180 },
      }),
    }),
    routeContext(createdZone.data.id),
  );

  expect((await moveZoneResponse.json()).data.rect.x).toBe(600);

  const reservationResponse = await CREATE_RESERVATION(
    new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: "table-4",
        guestName: "Новый гость",
        guestPhone: "+77001234567",
        guestsCount: 2,
        reservationDate: "2026-07-13T16:00:00.000Z",
        durationMinutes: 120,
        comment: "Тестовая бронь",
      }),
    }),
  );
  const createdReservation = (await reservationResponse.json()) as {
    data: ReturnType<typeof createRestaurantSeed>["reservations"][number];
  };

  expect(reservationResponse.status).toBe(201);
  expect(createdReservation.data.status).toBe("PENDING");

  const confirmResponse = await UPDATE_RESERVATION(
    new Request(
      `http://localhost/api/reservations/${createdReservation.data.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      },
    ),
    routeContext(createdReservation.data.id),
  );

  expect((await confirmResponse.json()).data.status).toBe("CONFIRMED");

  const deleteZoneResponse = await DELETE_ZONE(
    new Request(`http://localhost/api/zones/${createdZone.data.id}`, {
      method: "DELETE",
    }),
    routeContext(createdZone.data.id),
  );

  expect(deleteZoneResponse.status).toBe(204);

  const deleteAssignedZoneResponse = await DELETE_ZONE(
    new Request("http://localhost/api/zones/zone-window", {
      method: "DELETE",
    }),
    routeContext("zone-window"),
  );
  const finalState = (await GET_RESTAURANT().json()).data;

  expect(deleteAssignedZoneResponse.status).toBe(204);
  expect(
    finalState.tables.find((table: { id: string }) => table.id === "table-4")
      ?.zoneId,
  ).toBeUndefined();
});

test("rejects invalid granular mutation payloads", async () => {
  RESET_RESTAURANT();

  const invalidTable = await CREATE_TABLE(
    new Request("http://localhost/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: 25 }),
    }),
  );
  const invalidAction = await UPDATE_RESERVATION(
    new Request("http://localhost/api/reservations/reservation-3", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    }),
    routeContext("reservation-3"),
  );
  const deleteReservedTable = await DELETE_TABLE(
    new Request("http://localhost/api/tables/table-12", {
      method: "DELETE",
    }),
    routeContext("table-12"),
  );

  expect(invalidTable.status).toBe(400);
  expect(invalidAction.status).toBe(409);
  expect(deleteReservedTable.status).toBe(409);
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
