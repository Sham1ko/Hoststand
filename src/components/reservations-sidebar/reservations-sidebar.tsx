"use client";

import { format, startOfToday } from "date-fns";
import { useEffect, useState } from "react";

import {
  reservationFloorSeed,
  reservationTableSeed,
} from "@/features/reservations/data/seed";
import {
  filterReservationsByStatus,
} from "@/features/reservations/model/selectors";
import type {
  Reservation,
  ReservationsResponse,
  ReservationStatus,
  ReservationStatusCounts,
} from "@/features/reservations/model/types";
import {
  cancelReservation,
  completeReservation,
} from "@/features/reservations/model/transitions";

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

function moveStatusCount(
  counts: ReservationStatusCounts,
  from: ReservationStatus,
  to: ReservationStatus,
): ReservationStatusCounts {
  return {
    ...counts,
    [from]: counts[from] - 1,
    [to]: counts[to] + 1,
  };
}

export function ReservationsSidebar() {
  const [initialDate] = useState(() => startOfToday());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusCounts, setStatusCounts] =
    useState<ReservationStatusCounts>(emptyStatusCounts);
  const [date, setDate] = useState(initialDate);
  const [activeStatus, setActiveStatus] =
    useState<ReservationStatusFilterValue>("ALL");

  useEffect(() => {
    fetch(`/api/reservations?date=${format(date, "yyyy-MM-dd")}`)
      .then((response) => response.json())
      .then((response: ReservationsResponse) => {
        setReservations(response.data);
        setStatusCounts(response.meta.statusCounts);
      });
  }, [date]);

  const visibleReservations = filterReservationsByStatus(
    reservations,
    activeStatus === "ALL" ? null : activeStatus,
  );

  const handleComplete = (reservationId: string) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (reservation?.status !== "CONFIRMED") return;

    setReservations((current) =>
      completeReservation(current, reservationId),
    );
    setStatusCounts((current) =>
      moveStatusCount(current, reservation.status, "COMPLETED"),
    );
  };

  const handleCancel = (reservationId: string) => {
    const reservation = reservations.find((item) => item.id === reservationId);
    if (
      reservation?.status !== "PENDING" &&
      reservation?.status !== "CONFIRMED"
    ) {
      return;
    }

    setReservations((current) => cancelReservation(current, reservationId));
    setStatusCounts((current) =>
      moveStatusCount(current, reservation.status, "CANCELLED"),
    );
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
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </aside>
  );
}
