"use client";

import type {
  ReservationStatus,
  ReservationStatusCounts,
} from "@/entities/reservation/model/types";

const reservationStatuses = [
  { id: "ALL", label: "Все" },
  { id: "PENDING", label: "Ожидают" },
  { id: "CONFIRMED", label: "Подтверждены" },
  { id: "CANCELLED", label: "Отменены" },
  { id: "COMPLETED", label: "Завершены" },
] as const satisfies ReadonlyArray<{
  id: ReservationStatus | "ALL";
  label: string;
}>;

export type ReservationStatusFilterValue = ReservationStatus | "ALL";

type ReservationsStatusFilterProps = {
  value: ReservationStatusFilterValue;
  counts: ReservationStatusCounts;
  onValueChange: (status: ReservationStatusFilterValue) => void;
};

export function ReservationsStatusFilter({
  value,
  counts,
  onValueChange,
}: ReservationsStatusFilterProps) {
  return (
    <div
      aria-label="Фильтр по статусу"
      className="thin-scroll flex gap-1.5 overflow-x-auto pb-1"
    >
      {reservationStatuses.map((status) => {
        const isActive = value === status.id;

        return (
          <button
            key={status.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onValueChange(status.id)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            }`}
          >
            {status.label} {counts[status.id]}
          </button>
        );
      })}
    </div>
  );
}

