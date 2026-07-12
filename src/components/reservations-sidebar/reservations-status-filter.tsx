"use client";

import type { ReservationStatus } from "@/features/reservations/model/types";

const reservationStatuses = [
  { id: "ALL", label: "Все", count: 4 },
  { id: "PENDING", label: "Ожидают", count: 1 },
  { id: "CONFIRMED", label: "Подтверждены", count: 3 },
  { id: "CANCELLED", label: "Отменены", count: 0 },
  { id: "COMPLETED", label: "Завершены", count: 0 },
] as const satisfies ReadonlyArray<{
  id: ReservationStatus | "ALL";
  label: string;
  count: number;
}>;

export type ReservationStatusFilterValue = ReservationStatus | "ALL";

type ReservationsStatusFilterProps = {
  value: ReservationStatusFilterValue;
  onValueChange: (status: ReservationStatusFilterValue) => void;
};

export function ReservationsStatusFilter({
  value,
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
            {status.label} {status.count}
          </button>
        );
      })}
    </div>
  );
}
