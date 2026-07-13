import {
  GET,
  POST as CREATE_RESERVATION,
} from "@/app/api/reservations/route";
import { PATCH } from "@/app/api/reservations/[id]/route";
import { POST as RESET } from "@/app/api/reset/route";
import {
  formatGuestPhone,
  formatGuestsCount,
  formatReservationTimeRange,
} from "@/features/reservations/lib/formatters";
import {
  filterReservationsByDate,
  filterReservationsByStatus,
  getDisplayedTableStatus,
  getReservedTableIds,
  getReservationStatusCounts,
  getReservationTableContext,
} from "@/features/reservations/model/selectors";
import {
  cancelReservation,
  completeReservation,
  confirmReservation,
} from "@/features/reservations/model/transitions";
import type {
  Reservation,
  ReservationsResponse,
} from "@/features/reservations/model/types";

const reservation: Reservation = {
  id: "reservation-test",
  tableId: "table-1",
  guestName: "Тестовый гость",
  guestPhone: "+77051112233",
  guestsCount: 2,
  reservationDate: "2026-07-12T18:00:00",
  durationMinutes: 240,
  status: "CONFIRMED",
  createdAt: "2026-07-10T10:00:00",
};

test("formats a reservation time range from its start and duration", () => {
  expect(formatReservationTimeRange(reservation)).toBe("18:00–22:00");
});

test("uses correct Russian guest plural forms", () => {
  expect(formatGuestsCount(1)).toBe("1 гость");
  expect(formatGuestsCount(2)).toBe("2 гостя");
  expect(formatGuestsCount(5)).toBe("5 гостей");
  expect(formatGuestsCount(11)).toBe("11 гостей");
  expect(formatGuestsCount(21)).toBe("21 гость");
});

test("formats a normalized Kazakhstan phone number", () => {
  expect(formatGuestPhone("+77051112233")).toBe("+7 705 111 22 33");
});

test("counts reservations by API status", () => {
  const counts = getReservationStatusCounts([
    reservation,
    { ...reservation, id: "pending", status: "PENDING" },
    { ...reservation, id: "cancelled", status: "CANCELLED" },
  ]);

  expect(counts).toEqual({
    ALL: 3,
    PENDING: 1,
    CONFIRMED: 1,
    CANCELLED: 1,
    COMPLETED: 0,
  });
});

test("returns reservation status counts in API metadata", async () => {
  const response = GET(new Request("http://localhost/api/reservations"));
  const body = (await response.json()) as ReservationsResponse;

  expect(body.meta.statusCounts).toEqual(
    getReservationStatusCounts(body.data),
  );
});

test("confirms, completes, and cancels reservations through the API", async () => {
  const confirmResponse = await PATCH(
    new Request("http://localhost/api/reservations/reservation-3", {
      method: "PATCH",
      body: JSON.stringify({ action: "confirm" }),
    }),
    { params: Promise.resolve({ id: "reservation-3" }) },
  );
  const confirmed = (await confirmResponse.json()) as ReservationsResponse;

  expect(
    confirmed.data.find((item) => item.id === "reservation-3")?.status,
  ).toBe("CONFIRMED");
  expect(confirmed.meta.statusCounts.CONFIRMED).toBe(4);

  const completeResponse = await PATCH(
    new Request("http://localhost/api/reservations/reservation-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "complete" }),
    }),
    { params: Promise.resolve({ id: "reservation-1" }) },
  );
  const completed = (await completeResponse.json()) as ReservationsResponse;

  expect(
    completed.data.find((item) => item.id === "reservation-1")?.status,
  ).toBe("COMPLETED");
  expect(completed.meta.statusCounts.COMPLETED).toBe(2);

  const cancelResponse = await PATCH(
    new Request("http://localhost/api/reservations/reservation-2", {
      method: "PATCH",
      body: JSON.stringify({ action: "cancel" }),
    }),
    { params: Promise.resolve({ id: "reservation-2" }) },
  );
  const cancelled = (await cancelResponse.json()) as ReservationsResponse;

  expect(
    cancelled.data.find((item) => item.id === "reservation-2")?.status,
  ).toBe("CANCELLED");
  expect(cancelled.meta.statusCounts.CANCELLED).toBe(2);
});

test("creates a pending reservation through the API", async () => {
  const response = await CREATE_RESERVATION(
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
  const created = (await response.json()) as { data: Reservation };

  expect(response.status).toBe(201);
  expect(created.data).toEqual(
    expect.objectContaining({
      tableId: "table-4",
      guestName: "Новый гость",
      status: "PENDING",
    }),
  );

  const reservationsResponse = GET(
    new Request("http://localhost/api/reservations"),
  );
  const reservations =
    (await reservationsResponse.json()) as ReservationsResponse;

  expect(reservations.data).toContainEqual(created.data);
});

test("rejects invalid reservation data", async () => {
  const response = await CREATE_RESERVATION(
    new Request("http://localhost/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: "" }),
    }),
  );

  expect(response.status).toBe(400);
});

test("resets reservations to the initial seed through the API", async () => {
  const response = RESET();
  const reset = (await response.json()) as ReservationsResponse;

  expect(reset.data.find((item) => item.id === "reservation-1")?.status).toBe(
    "CONFIRMED",
  );
  expect(reset.data.find((item) => item.id === "reservation-3")?.status).toBe(
    "PENDING",
  );
  expect(reset.meta.statusCounts).toEqual(
    getReservationStatusCounts(reset.data),
  );
});

test("filters reservations by calendar date", () => {
  const nextDayReservation: Reservation = {
    ...reservation,
    id: "next-day",
    reservationDate: "2026-07-13T10:00:00",
  };

  expect(
    filterReservationsByDate(
      [reservation, nextDayReservation],
      new Date(2026, 6, 12),
    ).map((item) => item.id),
  ).toEqual(["reservation-test"]);
});

test("filters reservations by status and treats null as ALL", () => {
  const pendingReservation: Reservation = {
    ...reservation,
    id: "pending",
    status: "PENDING",
  };
  const reservations = [reservation, pendingReservation];

  expect(
    filterReservationsByStatus(reservations, "PENDING").map(
      (item) => item.id,
    ),
  ).toEqual(["pending"]);
  expect(filterReservationsByStatus(reservations, null)).toEqual(reservations);
});

test("derives reserved table statuses for active reservations on the selected date", () => {
  const selectedDate = new Date(2026, 6, 12);
  const reservedTableIds = getReservedTableIds(
    [
      reservation,
      { ...reservation, id: "pending", tableId: "table-2", status: "PENDING" },
      { ...reservation, id: "cancelled", tableId: "table-3", status: "CANCELLED" },
      {
        ...reservation,
        id: "tomorrow",
        tableId: "table-4",
        reservationDate: "2026-07-13T18:00:00",
      },
    ],
    selectedDate,
  );

  expect(reservedTableIds).toEqual(new Set(["table-1", "table-2"]));
  expect(
    getDisplayedTableStatus(
      {
        id: "table-1",
        number: 1,
        capacity: 4,
        floorId: "floor-1",
        status: "FREE",
        layout: { x: 0, y: 0, w: 100, h: 100, rotation: 0, shape: "square" },
      },
      reservedTableIds,
    ),
  ).toBe("RESERVED");
  expect(
    getDisplayedTableStatus(
      {
        id: "table-2",
        number: 2,
        capacity: 4,
        floorId: "floor-1",
        status: "OCCUPIED",
        layout: { x: 0, y: 0, w: 100, h: 100, rotation: 0, shape: "square" },
      },
      reservedTableIds,
    ),
  ).toBe("OCCUPIED");
});

test("resolves a reservation table and its floor through tableId", () => {
  expect(
    getReservationTableContext(
      "table-1",
      [{ id: "table-1", number: 12, capacity: 8, floorId: "floor-1" }],
      [{ id: "floor-1", name: "1 этаж" }],
    ),
  ).toEqual({ tableNumber: 12, capacity: 8, floorName: "1 этаж" });
});

test("completes only a confirmed reservation", () => {
  expect(completeReservation([reservation], reservation.id)[0].status).toBe(
    "COMPLETED",
  );

  const pendingReservation: Reservation = {
    ...reservation,
    status: "PENDING",
  };
  const reservations = [pendingReservation];

  expect(completeReservation(reservations, reservation.id)).toBe(reservations);
});

test("confirms only a pending reservation", () => {
  const pendingReservation: Reservation = {
    ...reservation,
    status: "PENDING",
  };

  const confirmedReservation = confirmReservation(
    [pendingReservation],
    reservation.id,
  );

  expect(confirmedReservation[0].status).toBe("CONFIRMED");

  const reservations = [reservation];

  expect(confirmReservation(reservations, reservation.id)).toBe(reservations);
});

test("cancels active reservations but leaves terminal statuses unchanged", () => {
  expect(cancelReservation([reservation], reservation.id)[0].status).toBe(
    "CANCELLED",
  );

  const completedReservation: Reservation = {
    ...reservation,
    status: "COMPLETED",
  };
  const reservations = [completedReservation];

  expect(cancelReservation(reservations, reservation.id)).toBe(reservations);
});
