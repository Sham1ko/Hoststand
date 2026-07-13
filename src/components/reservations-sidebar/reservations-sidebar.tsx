"use client";

import { startOfToday } from "date-fns";
import { useState } from "react";

import {
  reservationFloorSeed,
  reservationTableSeed,
  createReservationsSeed,
} from "@/features/reservations/data/seed";
import {
  filterReservationsByDate,
  filterReservationsByStatus,
  getReservationStatusCounts,
} from "@/features/reservations/model/selectors";

import { ReservationsList } from "./reservations-list";
import { ReservationsSidebarHeader } from "./reservations-sidebar-header";
import type { ReservationStatusFilterValue } from "./reservations-status-filter";

export function ReservationsSidebar() {
  const [initialDate] = useState(() => startOfToday());
  const [reservations] = useState(() => createReservationsSeed(initialDate));
  const [date, setDate] = useState(initialDate);
  const [activeStatus, setActiveStatus] =
    useState<ReservationStatusFilterValue>("ALL");

  const reservationsForDate = filterReservationsByDate(reservations, date);
  const statusCounts = getReservationStatusCounts(reservationsForDate);
  const visibleReservations = filterReservationsByStatus(
    reservationsForDate,
    activeStatus === "ALL" ? null : activeStatus,
  );

  return (
    <aside
      aria-label="Управление бронями"
      className="flex min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
    >
      <ReservationsSidebarHeader
        date={date}
        activeStatus={activeStatus}
        statusCounts={statusCounts}
        onDateChange={setDate}
        onStatusChange={setActiveStatus}
      />
      <ReservationsList
        reservations={visibleReservations}
        tables={reservationTableSeed}
        floors={reservationFloorSeed}
      />
    </aside>
  );
}
