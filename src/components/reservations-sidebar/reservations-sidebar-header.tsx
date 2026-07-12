"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ReservationStatusCounts } from "@/features/reservations/model/selectors";

import { ReservationsDatePicker } from "./reservations-date-picker";
import {
  ReservationsStatusFilter,
  type ReservationStatusFilterValue,
} from "./reservations-status-filter";

type ReservationsSidebarHeaderProps = {
  statusCounts: ReservationStatusCounts;
};

export function ReservationsSidebarHeader({
  statusCounts,
}: ReservationsSidebarHeaderProps) {
  const [date, setDate] = useState(() => new Date());
  const [activeStatus, setActiveStatus] =
    useState<ReservationStatusFilterValue>("ALL");

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Брони
        </h2>

        <Button type="button" size="default">
          <CalendarPlus aria-hidden="true" data-icon="inline-start" />
          Новая
        </Button>
      </div>

      <ReservationsDatePicker date={date} onDateChange={setDate} />

      <ReservationsStatusFilter
        value={activeStatus}
        counts={statusCounts}
        onValueChange={setActiveStatus}
      />
    </div>
  );
}
