import { CalendarX2 } from "lucide-react";

import {
  formatGuestPhone,
  formatReservationDateLabel,
  formatReservationTimeRange,
} from "@/components/reservations-sidebar/lib/formatters";
import { getReservationTableContext } from "@/features/reservation-management/model/selectors";
import type {
  Reservation,
  ReservationAction,
  ReservationFloorReference,
  ReservationTableReference,
} from "@/entities/reservation/model/types";

import { ReservationCard } from "./reservation-card";

type ReservationsListProps = {
  reservations: readonly Reservation[];
  tables: readonly ReservationTableReference[];
  floors: readonly ReservationFloorReference[];
  selectedTableId: string | null;
  onTableSelect: (tableId: string) => void;
  onAction: (reservationId: string, action: ReservationAction) => void;
};

export function ReservationsList({
  reservations,
  tables,
  floors,
  selectedTableId,
  onTableSelect,
  onAction,
}: ReservationsListProps) {
  if (reservations.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-slate-50 px-8 text-center">
        <div className="grid size-10 place-items-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
          <CalendarX2 aria-hidden="true" className="size-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Брони не найдены
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Попробуйте выбрать другую дату или изменить статус
        </p>
      </div>
    );
  }

  return (
    <div
      aria-label="Список броней"
      className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4"
    >
      {reservations.map((reservation) => {
        const table = getReservationTableContext(
          reservation.tableId,
          tables,
          floors,
        );

        if (!table) return null;

        return (
          <ReservationCard
            key={reservation.id}
            reservation={reservation}
            reservationId={reservation.id}
            time={formatReservationTimeRange(reservation)}
            dateLabel={formatReservationDateLabel(reservation)}
            guestName={reservation.guestName}
            status={reservation.status}
            tableNumber={table.tableNumber}
            floorName={table.floorName}
            guestsCount={reservation.guestsCount}
            phone={formatGuestPhone(reservation.guestPhone)}
            note={reservation.comment}
            isSelected={reservation.tableId === selectedTableId}
            onTableSelect={() => onTableSelect(reservation.tableId)}
            onAction={onAction}
          />
        );
      })}
    </div>
  );
}
