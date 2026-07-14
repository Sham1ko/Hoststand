import { CalendarPlus, MapPin, Users, X } from "lucide-react";

import {
  tableStatusAppearance,
  tableStatusOrder,
} from "@/components/table-status-appearance";
import { Button } from "@/components/ui/button";
import type {
  Reservation,
  ReservationAction,
  ReservationFloorReference,
} from "@/entities/reservation/model/types";
import type {
  DiningTable,
  TableStatus,
} from "@/entities/table/model/types";
import { formatTableCapacity } from "@/entities/table/model/format-table-capacity";

import { CreateReservationDialog } from "./create-reservation-dialog";
import { ReservationsList } from "./reservations-list";

type FocusedTableSidebarProps = {
  table: DiningTable;
  floor: ReservationFloorReference;
  zoneName?: string;
  reservations: readonly Reservation[];
  date: Date;
  onClose: () => void;
  onStatusChange: (status: TableStatus) => void;
  onReservationAction: (
    reservationId: string,
    action: ReservationAction,
  ) => void;
};

export function FocusedTableSidebar({
  table,
  floor,
  zoneName,
  reservations,
  date,
  onClose,
  onStatusChange,
  onReservationAction,
}: FocusedTableSidebarProps) {
  const status = tableStatusAppearance[table.status];

  return (
    <>
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              {floor.name}
              {zoneName ? ` · ${zoneName}` : ""}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
              Стол №{table.number}
            </h2>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Закрыть информацию о столе"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span
            className="rounded-full border px-2 py-1 font-medium"
            style={{
              backgroundColor: status.fill,
              borderColor: status.stroke,
              color: status.text,
            }}
          >
            {status.label}
          </span>
          <span className="flex items-center gap-1">
            <Users aria-hidden="true" className="size-3.5" />
            {formatTableCapacity(table.capacity)}
          </span>
          {zoneName && (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin aria-hidden="true" className="size-3.5" />
              <span className="truncate">{zoneName}</span>
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-slate-200 px-5 py-4">
        <p className="mb-2 text-xs font-medium text-slate-500">
          Изменить статус
        </p>
        <div className="flex flex-wrap gap-1.5">
          {tableStatusOrder.map((value) => {
            const appearance = tableStatusAppearance[value];
            const isActive = value === table.status;

            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                className="rounded-full border px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                style={
                  isActive
                    ? {
                        backgroundColor: appearance.fill,
                        borderColor: appearance.stroke,
                        color: appearance.text,
                      }
                    : undefined
                }
                onClick={() => onStatusChange(value)}
              >
                {appearance.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-slate-800">
            Брони стола
          </h3>
          <span className="text-xs font-medium text-slate-400">
            {reservations.length}
          </span>
        </div>

        {reservations.length > 0 ? (
          <ReservationsList
            reservations={reservations}
            tables={[table]}
            floors={[floor]}
            showTableContext={false}
            onAction={onReservationAction}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
            <CalendarPlus aria-hidden="true" className="size-6 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">
              Броней на эту дату нет
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <CreateReservationDialog
          date={date}
          tableId={table.id}
          trigger={
            <Button type="button" size="lg" className="w-full">
              <CalendarPlus aria-hidden="true" data-icon="inline-start" />
              Забронировать стол
            </Button>
          }
        />
      </div>
    </>
  );
}
