"use client";

import type { ReservationStatusCounts } from "@/features/reservations/model/types";

import { CreateReservationDialog } from "./create-reservation-dialog";
import { ReservationsDatePicker } from "./reservations-date-picker";
import {
  ReservationsStatusFilter,
  type ReservationStatusFilterValue,
} from "./reservations-status-filter";

type ReservationsSidebarHeaderProps = {
  date: Date;
  activeStatus: ReservationStatusFilterValue;
  statusCounts: ReservationStatusCounts;
  onDateChange: (date: Date) => void;
  onStatusChange: (status: ReservationStatusFilterValue) => void;
};

export function ReservationsSidebarHeader({
  date,
  activeStatus,
  statusCounts,
  onDateChange,
  onStatusChange,
}: ReservationsSidebarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Брони
        </h2>

        <CreateReservationDialog date={date} />
      </div>

      <ReservationsDatePicker date={date} onDateChange={onDateChange} />

      <ReservationsStatusFilter
        value={activeStatus}
        counts={statusCounts}
        onValueChange={onStatusChange}
      />
    </div>
  );
}
