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

  const loadReservations = useCallback(async (signal: AbortSignal) => {
    const data = await getReservations(dateParam, signal);

    if (!data || signal.aborted) return;
    setReservations(data.data);
    setStatusCounts(data.meta.statusCounts);
  }, [dateParam]);

  useEffect(() => {
    const controller = new AbortController();
    const reloadReservations = () => {
      void loadReservations(controller.signal);
    };

    reloadReservations();
    window.addEventListener(
      RESERVATIONS_CHANGED_EVENT,
      reloadReservations,
    );

    return () => {
      controller.abort();
      window.removeEventListener(
        RESERVATIONS_CHANGED_EVENT,
        reloadReservations,
      );
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
  const [date, setDate] = useState(startOfToday);
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
