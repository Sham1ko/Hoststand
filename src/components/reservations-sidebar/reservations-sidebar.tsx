"use client";

import { format, startOfToday } from "date-fns";
import { useEffect, useState } from "react";

import {
  reservationFloorSeed,
  reservationTableSeed,
} from "@/features/reservations/data/seed";
import { RESERVATIONS_CHANGED_EVENT } from "@/features/reservations/lib/events";
import { filterReservationsByStatus } from "@/features/reservations/model/selectors";
import type {
  Reservation,
  ReservationAction,
  ReservationsResponse,
  ReservationStatusCounts,
} from "@/features/reservations/model/types";

import { ReservationsList } from "./reservations-list";
import { ReservationsSidebarHeader } from "./reservations-sidebar-header";
import type { ReservationStatusFilterValue } from "./reservations-status-filter";

const emptyStatusCounts: ReservationStatusCounts = {
  ALL: 0,
  PENDING: 0,
  CONFIRMED: 0,
  CANCELLED: 0,
  COMPLETED: 0,
};

export function ReservationsSidebar() {
  const [initialDate] = useState(() => startOfToday());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusCounts, setStatusCounts] =
    useState<ReservationStatusCounts>(emptyStatusCounts);
  const [date, setDate] = useState(initialDate);
  const [activeStatus, setActiveStatus] =
    useState<ReservationStatusFilterValue>("ALL");

  useEffect(() => {
    const loadReservations = () => {
      fetch(`/api/reservations?date=${format(date, "yyyy-MM-dd")}`)
        .then((response) => response.json())
        .then((response: ReservationsResponse) => {
          setReservations(response.data);
          setStatusCounts(response.meta.statusCounts);
        });
    };

    loadReservations();
    window.addEventListener(RESERVATIONS_CHANGED_EVENT, loadReservations);

    return () => {
      window.removeEventListener(RESERVATIONS_CHANGED_EVENT, loadReservations);
    };
  }, [date]);

  const visibleReservations = filterReservationsByStatus(
    reservations,
    activeStatus === "ALL" ? null : activeStatus,
  );

  const runReservationAction = (
    reservationId: string,
    action: ReservationAction,
  ) => {
    fetch(
      `/api/reservations/${reservationId}?date=${format(date, "yyyy-MM-dd")}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    ).then(async (response) => {
      if (!response.ok) return;

      const data = (await response.json()) as ReservationsResponse;
      setReservations(data.data);
      setStatusCounts(data.meta.statusCounts);
    });
  };

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
        onAction={runReservationAction}
      />
    </aside>
  );
}
