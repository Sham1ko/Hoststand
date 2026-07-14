"use client";

import { format, parseISO } from "date-fns";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";
import type { Reservation } from "@/entities/reservation/model/types";

import { ReservationFormDialog } from "./reservation-form-dialog";

type EditReservationDialogProps = {
  reservation: Reservation;
};

export function EditReservationDialog({
  reservation,
}: EditReservationDialogProps) {
  const { state, updateReservation } = useRestaurant();

  return (
    <ReservationFormDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="default"
          className="ml-auto text-slate-400 hover:text-slate-700"
          onClick={(event) => event.stopPropagation()}
        >
          <Pencil aria-hidden="true" data-icon="inline-start" />
          Изменить
        </Button>
      }
      title="Редактировать бронь"
      description={`Изменение брони гостя ${reservation.guestName}`}
      defaultValues={{
        tableId: reservation.tableId,
        guestName: reservation.guestName,
        guestPhone: reservation.guestPhone,
        guestsCount: reservation.guestsCount,
        reservationDate: format(
          parseISO(reservation.reservationDate),
          "yyyy-MM-dd'T'HH:mm",
        ),
        durationMinutes: reservation.durationMinutes,
        comment: reservation.comment ?? "",
      }}
      tables={state.tables}
      floors={state.floors}
      submitLabel="Сохранить"
      submittingLabel="Сохранение..."
      requestErrorMessage="Не удалось сохранить изменения"
      onSubmit={(values) => updateReservation(reservation.id, values)}
    />
  );
}
