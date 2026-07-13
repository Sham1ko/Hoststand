import { GET } from "@/app/api/reservations/route";
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
  getReservationStatusCounts,
  getReservationTableContext,
} from "@/features/reservations/model/selectors";
import {
  cancelReservation,
  completeReservation,
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

test("completes and cancels reservations through the API", async () => {
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
    new Request("http://localhost/api/reservations/reservation-3", {
      method: "PATCH",
      body: JSON.stringify({ action: "cancel" }),
    }),
    { params: Promise.resolve({ id: "reservation-3" }) },
  );
  const cancelled = (await cancelResponse.json()) as ReservationsResponse;

  expect(
    cancelled.data.find((item) => item.id === "reservation-3")?.status,
  ).toBe("CANCELLED");
  expect(cancelled.meta.statusCounts.CANCELLED).toBe(2);
});

test("resets reservations to the initial seed through the API", async () => {
  const response = RESET(
    new Request("http://localhost/api/reset", {
      method: "POST",
    }),
  );
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
