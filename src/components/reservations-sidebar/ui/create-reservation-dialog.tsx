"use client";

import { format, setHours, setMinutes } from "date-fns";
import { CalendarPlus } from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";

import { ReservationFormDialog } from "./reservation-form-dialog";

type CreateReservationDialogProps = {
  date: Date;
  tableId?: string;
  trigger?: ReactElement;
};

export function CreateReservationDialog({
  date,
  tableId,
  trigger,
}: CreateReservationDialogProps) {
  const { state, createReservation } = useRestaurant();
  const defaultDateTime = format(
    setMinutes(setHours(date, 18), 0),
    "yyyy-MM-dd'T'HH:mm",
  );

  return (
    <ReservationFormDialog
      trigger={trigger ?? (
        <Button type="button" size="default">
          <CalendarPlus aria-hidden="true" data-icon="inline-start" />
          Новая
        </Button>
      )}
      title="Новая бронь"
      description="Заполните данные новой брони"
      defaultValues={{
        tableId: tableId ?? "",
        guestName: "",
        guestPhone: "+7",
        guestsCount: 2,
        reservationDate: defaultDateTime,
        durationMinutes: 120,
        comment: "",
      }}
      tables={state.tables}
      floors={state.floors}
      submitLabel="Создать бронь"
      submittingLabel="Создание..."
      requestErrorMessage="Не удалось создать бронь"
      onSubmit={createReservation}
    />
  );
}
