"use client";

import { CalendarPlus } from "lucide-react";
import { useState } from "react";

import { BookingsDatePicker } from "@/components/bookings-date-picker";
import {
  BookingsStatusFilter,
  type BookingStatusId,
} from "@/components/bookings-status-filter";
import { Button } from "@/components/ui/button";

export function BookingsSidebarHeader() {
  const [date, setDate] = useState(() => new Date(2026, 6, 12));
  const [activeStatus, setActiveStatus] = useState<BookingStatusId>("all");

  return (
    <div className="border-b border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          Брони
        </h2>

        <Button type="button" size="default">
          <CalendarPlus aria-hidden="true" data-icon="inline-start" />
          Новая
        </Button>
      </div>

      <div className="mt-4">
        <BookingsDatePicker date={date} onDateChange={setDate} />
      </div>

      <div className="mt-3">
        <BookingsStatusFilter
          value={activeStatus}
          onValueChange={setActiveStatus}
        />
      </div>
    </div>
  );
}
