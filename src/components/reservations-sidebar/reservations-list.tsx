import {
  formatGuestPhone,
  formatReservationDateLabel,
  formatReservationTimeRange,
} from "@/features/reservations/lib/formatters";
import { getReservationTableContext } from "@/features/reservations/model/selectors";
import type {
  Reservation,
  ReservationFloorReference,
  ReservationTableReference,
} from "@/features/reservations/model/types";

import { ReservationCard } from "./reservation-card";

type ReservationsListProps = {
  reservations: readonly Reservation[];
  tables: readonly ReservationTableReference[];
  floors: readonly ReservationFloorReference[];
};

export function ReservationsList({
  reservations,
  tables,
  floors,
}: ReservationsListProps) {
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
            time={formatReservationTimeRange(reservation)}
            dateLabel={formatReservationDateLabel(reservation)}
            guestName={reservation.guestName}
            status={reservation.status}
            tableNumber={table.tableNumber}
            floorName={table.floorName}
            guestsCount={reservation.guestsCount}
            phone={formatGuestPhone(reservation.guestPhone)}
            note={reservation.comment}
          />
        );
      })}
    </div>
  );
}
