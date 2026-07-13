"use client";

import { format, startOfToday } from "date-fns";
import { useCallback, useEffect, useState } from "react";

import {
  getReservations,
  updateReservationAction,
} from "@/features/reservations/api/reservations-api";
import {
  reservationFloorSeed,
  reservationTableSeed,
} from "@/features/reservations/data/seed";
import { RESERVATIONS_CHANGED_EVENT } from "@/features/reservations/lib/events";
import { filterReservationsByStatus } from "@/features/reservations/model/selectors";
import type {
  Reservation,
  ReservationAction,
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

function useReservations(date: Date) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusCounts, setStatusCounts] =
    useState<ReservationStatusCounts>(emptyStatusCounts);

  const dateParam = format(date, "yyyy-MM-dd");

  const loadReservations = useCallback(async () => {
    const data = await getReservations(dateParam);

    if (!data) return;
    setReservations(data.data);
    setStatusCounts(data.meta.statusCounts);
  }, [dateParam]);

  useEffect(() => {
    loadReservations();
    window.addEventListener(RESERVATIONS_CHANGED_EVENT, loadReservations);

    return () => {
      window.removeEventListener(RESERVATIONS_CHANGED_EVENT, loadReservations);
    };
  }, [loadReservations]);

  const runReservationAction = async (
    reservationId: string,
    action: ReservationAction,
  ) => {
    const data = await updateReservationAction(
      reservationId,
      action,
      dateParam,
    );

    if (!data) return;
    setReservations(data.data);
    setStatusCounts(data.meta.statusCounts);
  };

  return {
    reservations,
    statusCounts,
    runReservationAction,
  };
}

export function ReservationsSidebar() {
  const [initialDate] = useState(() => startOfToday());
  const [date, setDate] = useState(initialDate);
  const [activeStatus, setActiveStatus] =
    useState<ReservationStatusFilterValue>("ALL");
  const { reservations, statusCounts, runReservationAction } =
    useReservations(date);

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
        tables={reservationTableSeed}
        floors={reservationFloorSeed}
        onAction={runReservationAction}
      />
    </aside>
  );
}
