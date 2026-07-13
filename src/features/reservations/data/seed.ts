import { addDays, setHours, setMinutes, startOfDay } from "date-fns";

import {
  diningTableSeed,
  tableFloorSeed,
} from "@/features/floor-plan/data/seed";

import type {
  Reservation,
  ReservationFloorReference,
  ReservationTableReference,
} from "../model/types";

function createDate(
  referenceDate: Date,
  dayOffset: number,
  hour: number,
  minute = 0,
) {
  const day = addDays(startOfDay(referenceDate), dayOffset);
  return setMinutes(setHours(day, hour), minute).toISOString();
}

function createCreatedAt(referenceDate: Date, daysAgo: number) {
  return addDays(referenceDate, -daysAgo).toISOString();
}

export function createReservationsSeed(
  referenceDate = new Date(),
): Reservation[] {
  return [
    {
      id: "reservation-1",
      tableId: "table-12",
      guestName: "Мадина Ержанова",
      guestPhone: "+77051112233",
      guestsCount: 8,
      reservationDate: createDate(referenceDate, 0, 18),
      durationMinutes: 240,
      comment: "День рождения, нужен торт",
      status: "CONFIRMED",
      createdAt: createCreatedAt(referenceDate, 5),
    },
    {
      id: "reservation-2",
      tableId: "table-4",
      guestName: "Айгерим Сатпаева",
      guestPhone: "+77011234567",
      guestsCount: 3,
      reservationDate: createDate(referenceDate, 0, 19),
      durationMinutes: 120,
      comment: "У окна, пожалуйста",
      status: "CONFIRMED",
      createdAt: createCreatedAt(referenceDate, 3),
    },
    {
      id: "reservation-3",
      tableId: "table-9",
      guestName: "Данияр Ахметов",
      guestPhone: "+77029876543",
      guestsCount: 4,
      reservationDate: createDate(referenceDate, 0, 20, 30),
      durationMinutes: 90,
      status: "PENDING",
      createdAt: createCreatedAt(referenceDate, 1),
    },
    {
      id: "reservation-4",
      tableId: "table-21",
      guestName: "Арман Бекжанов",
      guestPhone: "+77074445566",
      guestsCount: 6,
      reservationDate: createDate(referenceDate, 0, 21),
      durationMinutes: 180,
      comment: "VIP, просили кальян",
      status: "CONFIRMED",
      createdAt: createCreatedAt(referenceDate, 4),
    },
    {
      id: "reservation-5",
      tableId: "table-7",
      guestName: "Алина Нургалиева",
      guestPhone: "+77773334455",
      guestsCount: 2,
      reservationDate: createDate(referenceDate, -1, 17),
      durationMinutes: 120,
      status: "COMPLETED",
      createdAt: createCreatedAt(referenceDate, 7),
    },
    {
      id: "reservation-6",
      tableId: "table-14",
      guestName: "Руслан Ибраев",
      guestPhone: "+77085556677",
      guestsCount: 2,
      reservationDate: createDate(referenceDate, 1, 15),
      durationMinutes: 120,
      status: "CANCELLED",
      createdAt: createCreatedAt(referenceDate, 2),
    },
  ];
}

export const reservationTableSeed: ReservationTableReference[] =
  diningTableSeed.map(({ id, number, capacity, floorId }) => ({
    id,
    number,
    capacity,
    floorId,
  }));

export const reservationFloorSeed: ReservationFloorReference[] =
  tableFloorSeed.map(({ id, name }) => ({ id, name }));
