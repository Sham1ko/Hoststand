import {
  Ban,
  CalendarClock,
  CircleCheck,
  CircleOff,
  PartyPopper,
  Trash2,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type {
  DiningTable,
  TableShape,
  TableStatus,
} from "@/entities/table/model/types";
import type { TablePatchInput } from "@/entities/table/model/schemas";

const fieldClassName =
  "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const labelClassName = "flex flex-col gap-1 text-xs font-medium text-slate-600";

const tableShapes: { value: TableShape; label: string }[] = [
  { value: "square", label: "Квадрат" },
  { value: "round", label: "Круг" },
  { value: "rect", label: "Прямоугольник" },
];

function TableShapeOption({
  shape,
  label,
}: {
  shape: TableShape;
  label: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`block shrink-0 border-2 border-current text-slate-500 ${
          shape === "round"
            ? "size-4 rounded-full"
            : shape === "square"
              ? "size-4 rounded-[3px]"
              : "h-3 w-6 rounded-[3px]"
        }`}
      />
      <span>{label}</span>
    </span>
  );
}

type TableStatusChoice = {
  value: TableStatus;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
};

const tableStatuses: TableStatusChoice[] = [
  {
    value: "FREE",
    label: "Свободен",
    icon: CircleCheck,
    iconClassName: "text-emerald-600",
  },
  {
    value: "OCCUPIED",
    label: "Занят",
    icon: UsersRound,
    iconClassName: "text-rose-500",
  },
  {
    value: "RESERVED",
    label: "Забронирован",
    icon: CalendarClock,
    iconClassName: "text-amber-500",
  },
  {
    value: "BANQUET",
    label: "Банкет",
    icon: PartyPopper,
    iconClassName: "text-violet-500",
  },
  {
    value: "MANUAL_BLOCKED",
    label: "Заблокирован",
    icon: Ban,
    iconClassName: "text-slate-600",
  },
  {
    value: "INACTIVE",
    label: "Неактивен",
    icon: CircleOff,
    iconClassName: "text-slate-400",
  },
];

function TableStatusOption({ option }: { option: TableStatusChoice }) {
  const Icon = option.icon;

  return (
    <span className="flex items-center gap-2">
      <Icon
        aria-hidden="true"
        className={`size-3.5 shrink-0 ${option.iconClassName}`}
      />
      <span>{option.label}</span>
    </span>
  );
}

type TableFormValues = {
  number: string;
  capacity: string;
  shape: TableShape;
  rotation: number;
  width: string;
  height: string;
  status: TableStatus;
};

function getTableFormValues(table: DiningTable): TableFormValues {
  return {
    number: String(table.number),
    capacity: String(table.capacity),
    shape: table.layout.shape,
    rotation: normalizeRotation(table.layout.rotation),
    width: String(table.layout.w),
    height: String(table.layout.h),
    status: table.status,
  };
}

type NumericTableField =
  | "number"
  | "capacity"
  | "width"
  | "height";

function normalizeRotation(rotation: number) {
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  return normalizedRotation === 0 && rotation > 0 ? 360 : normalizedRotation;
}

type FloorMapEditorPanelProps = {
  table: DiningTable;
  hasReservations: boolean;
  onChange: (patch: TablePatchInput) => void;
  onDelete: () => void;
};

export function FloorMapEditorPanel({
  table,
  hasReservations,
  onChange,
  onDelete,
}: FloorMapEditorPanelProps) {
  const shapeLabelId = useId();
  const statusLabelId = useId();
  const [values, setValues] = useState(() => getTableFormValues(table));
  const selectedStatus = tableStatuses.find(
    (status) => status.value === values.status,
  );

  const updateNumericField = (field: NumericTableField, rawValue: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: rawValue,
    }));

    if (rawValue.trim() === "") return;

    const value = Number(rawValue);

    if (!Number.isFinite(value)) return;

    if (field === "number" || field === "capacity") {
      if (!Number.isInteger(value) || value < 1) return;

      onChange({ [field]: value });
      return;
    }

    if (value < 40) return;

    onChange({ layout: { [field === "width" ? "w" : "h"]: value } });
  };

  const handleDelete = () => {
    if (!window.confirm(`Удалить стол №${table.number}?`)) return;

    onDelete();
  };

  const selectShape = (shape: TableShape) => {
    setValues((currentValues) => ({ ...currentValues, shape }));
    onChange({ layout: { shape } });
  };

  const updateRotation = (rotation: number) => {
    setValues((currentValues) => ({ ...currentValues, rotation }));
    onChange({ layout: { rotation } });
  };

  const selectStatus = (status: TableStatus) => {
    setValues((currentValues) => ({ ...currentValues, status }));
    onChange({ status });
  };

  return (
    <section
      aria-label={`Свойства стола №${table.number}`}
      className="absolute top-4 left-4 z-10 w-64 max-w-[calc(100%-2rem)] rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-950">
          Стол №{table.number}
        </h3>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          aria-label="Удалить стол"
          title={
            hasReservations
              ? "Нельзя удалить стол со связанными бронями"
              : "Удалить стол"
          }
          disabled={hasReservations}
          onClick={handleDelete}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className={labelClassName}>
          Номер
          <input
            type="number"
            min={1}
            required
            className={fieldClassName}
            value={values.number}
            onChange={(event) =>
              updateNumericField("number", event.target.value)
            }
          />
        </label>
        <label className={labelClassName}>
          Мест
          <input
            type="number"
            min={1}
            required
            className={fieldClassName}
            value={values.capacity}
            onChange={(event) =>
              updateNumericField("capacity", event.target.value)
            }
          />
        </label>
        <div className="col-span-2 flex min-w-0 flex-col gap-1">
          <span
            id={shapeLabelId}
            className="text-xs font-medium text-slate-600"
          >
            Форма
          </span>

          <Select<TableShape>
            value={values.shape}
            onValueChange={(shape) => {
              if (shape) selectShape(shape);
            }}
          >
            <SelectTrigger
              size="default"
              aria-labelledby={shapeLabelId}
              className="h-8 w-full bg-white"
            >
              <SelectValue>
                <TableShapeOption
                  shape={values.shape}
                  label={
                    tableShapes.find((shape) => shape.value === values.shape)
                      ?.label ?? ""
                  }
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {tableShapes.map((shape) => (
                <SelectItem key={shape.value} value={shape.value}>
                  <TableShapeOption
                    shape={shape.value}
                    label={shape.label}
                  />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">Поворот</span>
            <output className="min-w-10 rounded-md bg-slate-100 px-2 py-0.5 text-center text-[11px] font-medium tabular-nums text-slate-600">
              {values.rotation}°
            </output>
          </div>
          <Slider
            aria-label="Поворот стола"
            min={0}
            max={360}
            step={1}
            value={[values.rotation]}
            className="py-1"
            onValueChange={(rotation) => {
              const nextRotation =
                typeof rotation === "number" ? rotation : rotation[0];

              updateRotation(nextRotation ?? values.rotation);
            }}
          />
        </div>
        <label className={labelClassName}>
          Ширина
          <input
            type="number"
            min={40}
            required
            className={fieldClassName}
            value={values.width}
            onChange={(event) =>
              updateNumericField("width", event.target.value)
            }
          />
        </label>
        <label className={labelClassName}>
          Длина
          <input
            type="number"
            min={40}
            required
            className={fieldClassName}
            value={values.height}
            onChange={(event) =>
              updateNumericField("height", event.target.value)
            }
          />
        </label>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <span
          id={statusLabelId}
          className="text-xs font-medium text-slate-600"
        >
          Статус
        </span>
        <Select<TableStatus>
          value={values.status}
          onValueChange={(status) => {
            if (status) selectStatus(status);
          }}
        >
          <SelectTrigger
            size="default"
            aria-labelledby={statusLabelId}
            className="h-8 w-full bg-white"
          >
            <SelectValue>
              {selectedStatus && <TableStatusOption option={selectedStatus} />}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {tableStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <TableStatusOption option={status} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasReservations && (
        <p className="mt-2 text-xs text-slate-500">Есть связанные брони</p>
      )}
      <p className="mt-3 text-[11px] text-slate-400">
        Сохранение — общей кнопкой сверху
      </p>
    </section>
  );
}
