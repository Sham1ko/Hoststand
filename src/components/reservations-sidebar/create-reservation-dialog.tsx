"use client";

import { format, setHours, setMinutes } from "date-fns";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useState, type SubmitEvent } from "react";

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
import { RESERVATIONS_CHANGED_EVENT } from "@/features/reservations/lib/events";

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-slate-400";

const labelClassName = "flex flex-col gap-1.5 text-sm font-medium text-slate-600";

type CreateReservationDialogProps = {
  date: Date;
};

export function CreateReservationDialog({
  date,
}: CreateReservationDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const defaultDateTime = format(
    setMinutes(setHours(date, 18), 0),
    "yyyy-MM-dd'T'HH:mm",
  );

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: formData.get("tableId"),
        guestName: formData.get("guestName"),
        guestPhone: formData.get("guestPhone"),
        guestsCount: Number(formData.get("guestsCount")),
        reservationDate: formData.get("reservationDate"),
        durationMinutes: Number(formData.get("durationMinutes")),
        comment: formData.get("comment"),
      }),
    });

    if (!response.ok) {
      setError("Не удалось создать бронь");
      return;
    }

    form.reset();
    setOpen(false);
    window.dispatchEvent(new Event(RESERVATIONS_CHANGED_EVENT));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setError(undefined);
      }}
    >
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

        <form key={defaultDateTime} onSubmit={handleSubmit}>
          <div className="grid gap-4 px-6 py-5">
          <label className={labelClassName}>
            Стол
            <span className="relative">
              <select
                name="tableId"
                defaultValue=""
                required
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
              name="guestName"
              placeholder="Иван Иванов"
              required
              className={fieldClassName}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClassName}>
              Телефон
              <input
                type="tel"
                name="guestPhone"
                defaultValue="+7"
                required
                className={fieldClassName}
              />
            </label>

            <label className={labelClassName}>
              Гостей
              <input
                type="number"
                name="guestsCount"
                min={1}
                defaultValue={2}
                required
                className={fieldClassName}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className={labelClassName}>
              Дата и время
              <input
                type="datetime-local"
                name="reservationDate"
                defaultValue={defaultDateTime}
                required
                className={fieldClassName}
              />
            </label>

            <label className={labelClassName}>
              Длительность
              <span className="relative">
                <select
                  name="durationMinutes"
                  defaultValue="120"
                  required
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
              name="comment"
              rows={3}
              placeholder="У окна, пожалуйста"
              className="min-h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-slate-400"
            />
          </label>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="grid grid-cols-2 border-t border-slate-100 px-6 py-4">
            <DialogClose
              render={
                <Button type="button" variant="outline" size="lg" />
              }
            >
              Отмена
            </DialogClose>
            <Button type="submit" size="lg">
              Создать бронь
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
