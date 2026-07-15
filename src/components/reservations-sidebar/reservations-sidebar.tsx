"use client";

import { useState } from "react";

import {
  filterReservationsByDate,
  filterReservationsByStatus,
  getReservationStatusCounts,
} from "@/features/reservation-management/model/selectors";
import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";

import { ReservationsList } from "./ui/reservations-list";
import { FocusedTableSidebar } from "./ui/focused-table-sidebar";
import { ReservationsSidebarHeader } from "./ui/reservations-sidebar-header";
import type { ReservationStatusFilterValue } from "./ui/reservations-status-filter";

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
    updateTable,
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
  const focusedTable = state.tables.find(
    (table) => table.id === focusedReservationTableId,
  );
  const focusedFloor = focusedTable
    ? state.floors.find((floor) => floor.id === focusedTable.floorId)
    : undefined;
  const focusedZone = focusedTable?.zoneId
    ? state.zones.find((zone) => zone.id === focusedTable.zoneId)
    : undefined;
  const focusedTableReservations = focusedTable
    ? reservations.filter(
        (reservation) => reservation.tableId === focusedTable.id,
      )
    : [];

  return (
    <aside
      aria-label="Управление бронями"
      className="flex min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
    >
      {focusedTable && focusedFloor ? (
        <FocusedTableSidebar
          table={focusedTable}
          floor={focusedFloor}
          zoneName={focusedZone?.name}
          reservations={focusedTableReservations}
          date={reservationDate}
          onClose={() => setFocusedReservationTableId(null)}
          onStatusChange={(status) => {
            if (status !== focusedTable.status) {
              void updateTable(focusedTable.id, { status });
            }
          }}
          onReservationAction={(reservationId, action) => {
            void applyReservationAction(reservationId, action);
          }}
        />
      ) : (
        <>
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
        </>
      )}
    </aside>
  );
}
