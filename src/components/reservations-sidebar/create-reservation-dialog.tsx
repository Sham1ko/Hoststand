"use client";

import { format, setHours, setMinutes } from "date-fns";
import { CalendarPlus, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { reservationTableSeed } from "@/features/reservations/data/seed";

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-slate-400";

const labelClassName = "flex flex-col gap-1.5 text-sm font-medium text-slate-600";

type CreateReservationDialogProps = {
  date: Date;
};

export function CreateReservationDialog({
  date,
}: CreateReservationDialogProps) {
  const defaultDateTime = format(
    setMinutes(setHours(date, 18), 0),
    "yyyy-MM-dd'T'HH:mm",
  );

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button type="button" size="default">
            <CalendarPlus aria-hidden="true" data-icon="inline-start" />
            Новая
          </Button>
        }
      />

      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-xl [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
            Новая бронь
          </DialogTitle>
          <DialogDescription className="sr-only">
            Заполните данные новой брони
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-5">
          <label className={labelClassName}>
            Стол
            <span className="relative">
              <select
                defaultValue=""
                className={`${fieldClassName} appearance-none pr-10`}
              >
                <option value="" disabled>
                  Выберите стол...
                </option>
                {reservationTableSeed.map((table) => (
                  <option key={table.id} value={table.id}>
                    Стол №{table.number} · до {table.capacity} гостей
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
              />
            </span>
          </label>

          <label className={labelClassName}>
            Имя гостя
            <input
              type="text"
              placeholder="Иван Иванов"
              className={fieldClassName}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClassName}>
              Телефон
              <input
                type="tel"
                defaultValue="+7"
                className={fieldClassName}
              />
            </label>

            <label className={labelClassName}>
              Гостей
              <input
                type="number"
                min={1}
                defaultValue={2}
                className={fieldClassName}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClassName}>
              Дата и время
              <input
                type="datetime-local"
                defaultValue={defaultDateTime}
                className={fieldClassName}
              />
            </label>

            <label className={labelClassName}>
              Длительность
              <span className="relative">
                <select
                  defaultValue="120"
                  className={`${fieldClassName} appearance-none pr-10`}
                >
                  <option value="60">1 час</option>
                  <option value="90">1,5 часа</option>
                  <option value="120">2 часа</option>
                  <option value="180">3 часа</option>
                  <option value="240">4 часа</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
                />
              </span>
            </label>
          </div>

          <label className={labelClassName}>
            Комментарий
            <textarea
              rows={3}
              placeholder="У окна, пожалуйста"
              className="min-h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-slate-400"
            />
          </label>
        </div>

        <DialogFooter className="grid grid-cols-2 border-t border-slate-100 px-6 py-4">
          <DialogClose
            render={
              <Button type="button" variant="outline" size="lg" />
            }
          >
            Отмена
          </DialogClose>
          <Button type="button" size="lg">
            Создать бронь
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
