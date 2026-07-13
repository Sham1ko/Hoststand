import {
  Check,
  MessageSquareText,
  Pencil,
  Phone,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatGuestsCount } from "@/features/reservations/lib/formatters";
import type { ReservationStatus } from "@/features/reservations/model/types";

const statusStyles: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Ожидает",
    className: "bg-amber-50 text-amber-700",
  },
  CONFIRMED: {
    label: "Подтверждена",
    className: "bg-emerald-50 text-emerald-700",
  },
  CANCELLED: {
    label: "Отменена",
    className: "bg-rose-50 text-rose-600",
  },
  COMPLETED: {
    label: "Завершена",
    className: "bg-slate-100 text-slate-600",
  },
};

export type ReservationCardProps = {
  time: string;
  dateLabel: string;
  guestName: string;
  status: ReservationStatus;
  tableNumber: number;
  floorName: string;
  guestsCount: number;
  phone: string;
  note?: string;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
};

export function ReservationCard({
  time,
  dateLabel,
  guestName,
  status,
  tableNumber,
  floorName,
  guestsCount,
  phone,
  note,
  onConfirm,
  onComplete,
  onCancel,
}: ReservationCardProps) {
  const statusStyle = statusStyles[status];
  const canConfirm = status === "PENDING";
  const canComplete = status === "CONFIRMED";
  const canCancel = status === "PENDING" || status === "CONFIRMED";
  const canEdit = canCancel;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">
            {time}{" "}
            <span className="text-xs font-medium text-slate-400">
              {dateLabel}
            </span>
          </p>
          <h3 className="mt-0.5 truncate text-sm font-medium text-slate-800">
            {guestName}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${statusStyle.className}`}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
          Стол №{tableNumber} · {floorName}
        </span>
        <span className="flex items-center gap-1">
          <Users aria-hidden="true" className="size-3.5" />
          {formatGuestsCount(guestsCount)}
        </span>
      </div>

      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
        <Phone aria-hidden="true" className="size-3.5" />
        {phone}
      </p>

      {note && (
        <p className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
          <MessageSquareText aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{note}</span>
        </p>
      )}

      {canEdit && (
        <div className="mt-3 flex items-center gap-1.5">
          {canConfirm && (
            <Button
              type="button"
              size="default"
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              onClick={onConfirm}
            >
              <Check aria-hidden="true" data-icon="inline-start" />
              Подтвердить
            </Button>
          )}
          {canComplete && (
            <Button
              type="button"
              size="default"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={onComplete}
            >
              <Check aria-hidden="true" data-icon="inline-start" />
              Завершить
            </Button>
          )}
          {canCancel && (
            <Button
              type="button"
              variant="destructive"
              size="default"
              onClick={onCancel}
            >
              <X aria-hidden="true" data-icon="inline-start" />
              Отменить
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="default"
            className="ml-auto text-slate-400 hover:text-slate-700"
          >
            <Pencil aria-hidden="true" data-icon="inline-start" />
            Изменить
          </Button>
        </div>
      )}
    </article>
  );
}
