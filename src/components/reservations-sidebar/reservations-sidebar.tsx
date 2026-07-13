"use client";

import { useState } from "react";

import {
  reservationFloorSeed,
  reservationTableSeed,
  createReservationsSeed,
} from "@/features/reservations/data/seed";
import { getReservationStatusCounts } from "@/features/reservations/model/selectors";

import { ReservationsList } from "./reservations-list";
import { ReservationsSidebarHeader } from "./reservations-sidebar-header";

export function ReservationsSidebar() {
  const [reservations] = useState(() => createReservationsSeed());
  const statusCounts = getReservationStatusCounts(reservations);

  return (
    <aside
      aria-label="Управление бронями"
      className="flex min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
    >
      <ReservationsSidebarHeader statusCounts={statusCounts} />
      <ReservationsList
        reservations={reservations}
        tables={reservationTableSeed}
        floors={reservationFloorSeed}
      />
    </aside>
  );
}
