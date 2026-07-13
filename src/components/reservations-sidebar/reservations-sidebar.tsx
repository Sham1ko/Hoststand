"use client";

import { useState } from "react";

import {
  filterReservationsByDate,
  filterReservationsByStatus,
  getReservationStatusCounts,
} from "@/features/reservations/model/selectors";
import { useRestaurant } from "@/features/restaurant/ui/restaurant-provider";

import { ReservationsList } from "./reservations-list";
import { ReservationsSidebarHeader } from "./reservations-sidebar-header";
import type { ReservationStatusFilterValue } from "./reservations-status-filter";

export function ReservationsSidebar() {
  const [activeStatus, setActiveStatus] =
    useState<ReservationStatusFilterValue>("ALL");
  const {
    state,
    reservationDate,
    setReservationDate,
    focusedReservationTableId,
    setFocusedReservationTableId,
    setActiveFloorId,
    applyReservationAction,
  } = useRestaurant();
  const reservations = filterReservationsByDate(
    state.reservations,
    reservationDate,
  );
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
        date={reservationDate}
        activeStatus={activeStatus}
        statusCounts={statusCounts}
        onDateChange={setReservationDate}
        onStatusChange={setActiveStatus}
      />
      <ReservationsList
        reservations={visibleReservations}
        tables={state.tables}
        floors={state.floors}
        selectedTableId={focusedReservationTableId}
        onTableSelect={(tableId) => {
          setFocusedReservationTableId(tableId);

          const table = state.tables.find((item) => item.id === tableId);

          if (table && table.floorId !== state.activeFloorId) {
            void setActiveFloorId(table.floorId);
          }
        }}
        onAction={(reservationId, action) => {
          void applyReservationAction(reservationId, action);
        }}
      />
    </aside>
  );
}
