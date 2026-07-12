"use client";

const reservationStatuses = [
  { id: "all", label: "Все", count: 4 },
  { id: "waiting", label: "Ожидают", count: 1 },
  { id: "confirmed", label: "Подтверждены", count: 3 },
  { id: "completed", label: "Завершены", count: 0 },
] as const;

export type ReservationStatusId = (typeof reservationStatuses)[number]["id"];

type ReservationsStatusFilterProps = {
  value: ReservationStatusId;
  onValueChange: (status: ReservationStatusId) => void;
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
