"use client";

import { startOfToday } from "date-fns";
import { useState } from "react";

import {
  filterReservationsByDate,
  filterReservationsByStatus,
  getReservationStatusCounts,
} from "@/features/reservations/model/selectors";
import { useRestaurant } from "@/features/restaurant-state/ui/restaurant-provider";

import { ReservationsList } from "./reservations-list";
import { ReservationsSidebarHeader } from "./reservations-sidebar-header";
import type { ReservationStatusFilterValue } from "./reservations-status-filter";

export function ReservationsSidebar() {
  const [date, setDate] = useState(startOfToday);
  const [activeStatus, setActiveStatus] =
    useState<ReservationStatusFilterValue>("ALL");
  const { state, applyReservationAction } = useRestaurant();
  const reservations = filterReservationsByDate(state.reservations, date);
  const statusCounts = getReservationStatusCounts(reservations);

  const visibleReservations = filterReservationsByStatus(
    reservations,
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
        tables={state.tables}
        floors={state.floors}
        onAction={(reservationId, action) => {
          void applyReservationAction(reservationId, action);
        }}
      />
    </aside>
  );
}
