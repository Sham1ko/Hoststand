"use client";

import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type BookingsDatePickerProps = {
  date: Date;
  onDateChange: (date: Date) => void;
};

export function BookingsDatePicker({
  date,
  onDateChange,
}: BookingsDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectDate = (nextDate: Date | undefined) => {
    if (!nextDate) return;

    onDateChange(nextDate);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Предыдущий день"
        onClick={() => onDateChange(addDays(date, -1))}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="h-9 min-w-0 flex-1 justify-between px-3 text-left text-sm font-medium"
            />
          }
        >
          {format(date, "dd.MM.yyyy")}
          <CalendarIcon aria-hidden="true" className="text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="center" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={selectDate}
            locale={ru}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Следующий день"
        onClick={() => onDateChange(addDays(date, 1))}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
