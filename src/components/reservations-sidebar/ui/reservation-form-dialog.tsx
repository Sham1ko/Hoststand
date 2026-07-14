"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ChevronDown } from "lucide-react";
import { useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";

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
import {
  createReservationSchema,
  type CreateReservationFormValues,
  type CreateReservationInput,
} from "@/entities/reservation/model/schemas";
import type {
  ReservationFloorReference,
  ReservationTableReference,
} from "@/entities/reservation/model/types";
import { formatTableCapacity } from "@/entities/table/model/format-table-capacity";

const fieldClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 aria-invalid:border-red-400 aria-invalid:ring-2 aria-invalid:ring-red-100 placeholder:text-slate-400";

const labelClassName = "flex flex-col gap-1.5 text-sm font-medium text-slate-600";
const errorClassName = "text-xs font-normal text-red-600";

type ReservationFormDialogProps = {
  trigger: ReactElement;
  title: string;
  description: string;
  defaultValues: CreateReservationFormValues;
  tables: readonly ReservationTableReference[];
  floors: readonly ReservationFloorReference[];
  submitLabel: string;
  submittingLabel: string;
  requestErrorMessage: string;
  onSubmit: (values: CreateReservationInput) => Promise<boolean>;
};

export function ReservationFormDialog({
  trigger,
  title,
  description,
  defaultValues,
  tables,
  floors,
  submitLabel,
  submittingLabel,
  requestErrorMessage,
  onSubmit,
}: ReservationFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<
    CreateReservationFormValues,
    unknown,
    CreateReservationInput
  >({
    resolver: standardSchemaResolver(createReservationSchema),
    defaultValues,
  });

  const resetDialog = () => {
    reset(defaultValues);
    clearErrors();
    setRequestError(undefined);
  };

  const submitReservation = async (values: CreateReservationInput) => {
    setRequestError(undefined);

    if (!(await onSubmit(values))) {
      setRequestError(requestErrorMessage);
      return;
    }

    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        resetDialog();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger render={trigger} />

      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-xl **:data-[slot=dialog-close]:top-4 **:data-[slot=dialog-close]:right-4">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitReservation)}>
          <div className="grid gap-4 px-6 py-5">
            <label className={labelClassName}>
              Стол
              <span className="relative">
                <select
                  {...register("tableId")}
                  aria-invalid={Boolean(errors.tableId)}
                  className={`${fieldClassName} appearance-none pr-10`}
                >
                  <option value="" disabled>
                    Выберите стол...
                  </option>
                  {floors.map((floor) => {
                    const floorTables = tables.filter(
                      (table) => table.floorId === floor.id,
                    );

                    if (floorTables.length === 0) return null;

                    return (
                      <optgroup key={floor.id} label={floor.name}>
                        {floorTables.map((table) => (
                          <option key={table.id} value={table.id}>
                            Стол №{table.number} · {formatTableCapacity(table.capacity)}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-500"
                />
              </span>
              {errors.tableId && (
                <span className={errorClassName}>{errors.tableId.message}</span>
              )}
            </label>

            <label className={labelClassName}>
              Имя гостя
              <input
                {...register("guestName")}
                type="text"
                placeholder="Иван Иванов"
                aria-invalid={Boolean(errors.guestName)}
                className={fieldClassName}
              />
              {errors.guestName && (
                <span className={errorClassName}>
                  {errors.guestName.message}
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className={labelClassName}>
                Телефон
                <input
                  {...register("guestPhone")}
                  type="tel"
                  aria-invalid={Boolean(errors.guestPhone)}
                  className={fieldClassName}
                />
                {errors.guestPhone && (
                  <span className={errorClassName}>
                    {errors.guestPhone.message}
                  </span>
                )}
              </label>

              <label className={labelClassName}>
                Гостей
                <input
                  {...register("guestsCount", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  aria-invalid={Boolean(errors.guestsCount)}
                  className={fieldClassName}
                />
                {errors.guestsCount && (
                  <span className={errorClassName}>
                    {errors.guestsCount.message}
                  </span>
                )}
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className={labelClassName}>
                Дата и время
                <input
                  {...register("reservationDate")}
                  type="datetime-local"
                  aria-invalid={Boolean(errors.reservationDate)}
                  className={fieldClassName}
                />
                {errors.reservationDate && (
                  <span className={errorClassName}>
                    {errors.reservationDate.message}
                  </span>
                )}
              </label>

              <label className={labelClassName}>
                Длительность
                <span className="relative">
                  <select
                    {...register("durationMinutes", {
                      setValueAs: (value) => Number(value),
                    })}
                    aria-invalid={Boolean(errors.durationMinutes)}
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
                {errors.durationMinutes && (
                  <span className={errorClassName}>
                    {errors.durationMinutes.message}
                  </span>
                )}
              </label>
            </div>

            <label className={labelClassName}>
              Комментарий
              <textarea
                {...register("comment")}
                rows={3}
                placeholder="У окна, пожалуйста"
                className="min-h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 placeholder:text-slate-400"
              />
            </label>

            {requestError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {requestError}
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
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? submittingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
