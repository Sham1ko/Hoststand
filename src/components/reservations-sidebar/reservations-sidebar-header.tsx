"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { ReservationsDatePicker } from "./reservations-date-picker";
import {
  ReservationsStatusFilter,
  type ReservationStatusId,
} from "./reservations-status-filter";

export function ReservationsSidebarHeader() {
  const [date, setDate] = useState(() => new Date());
  const [activeStatus, setActiveStatus] = useState<ReservationStatusId>("all");

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
        onValueChange={setActiveStatus}
      />
    </div>
  );
}
