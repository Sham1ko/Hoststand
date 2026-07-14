import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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

const tableStatuses: { value: TableStatus; label: string }[] = [
  { value: "FREE", label: "Свободен" },
  { value: "OCCUPIED", label: "Занят" },
  { value: "RESERVED", label: "Забронирован" },
  { value: "BANQUET", label: "Банкет" },
  { value: "MANUAL_BLOCKED", label: "Заблокирован" },
  { value: "INACTIVE", label: "Неактивен" },
];

type TableFormValues = {
  number: string;
  capacity: string;
  shape: TableShape;
  rotation: string;
  width: string;
  height: string;
  status: TableStatus;
};

function getTableFormValues(table: DiningTable): TableFormValues {
  return {
    number: String(table.number),
    capacity: String(table.capacity),
    shape: table.layout.shape,
    rotation: String(table.layout.rotation),
    width: String(table.layout.w),
    height: String(table.layout.h),
    status: table.status,
  };
}

type NumericTableField =
  | "number"
  | "capacity"
  | "rotation"
  | "width"
  | "height";

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
  const [values, setValues] = useState(() => getTableFormValues(table));

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

    if (field === "rotation") {
      onChange({ layout: { rotation: value } });
      return;
    }

    if (value < 40) return;

    onChange({ layout: { [field === "width" ? "w" : "h"]: value } });
  };

  const handleDelete = () => {
    if (!window.confirm(`Удалить стол №${table.number}?`)) return;

    onDelete();
  };

  return (
    <section
      aria-label={`Свойства стола №${table.number}`}
      className="absolute top-4 left-4 z-10 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
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
        <label className={labelClassName}>
          Форма
          <select
            className={fieldClassName}
            value={values.shape}
            onChange={(event) => {
              const shape = event.target.value as TableShape;
              setValues((currentValues) => ({ ...currentValues, shape }));
              onChange({ layout: { shape } });
            }}
          >
            {tableShapes.map((shape) => (
              <option key={shape.value} value={shape.value}>
                {shape.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClassName}>
          Поворот
          <input
            type="number"
            className={fieldClassName}
            value={values.rotation}
            onChange={(event) =>
              updateNumericField("rotation", event.target.value)
            }
          />
        </label>
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

      <label className={`mt-2 ${labelClassName}`}>
        Статус
        <select
          className={fieldClassName}
          value={values.status}
          onChange={(event) => {
            const status = event.target.value as TableStatus;
            setValues((currentValues) => ({ ...currentValues, status }));
            onChange({ status });
          }}
        >
          {tableStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      {hasReservations && (
        <p className="mt-2 text-xs text-slate-500">Есть связанные брони</p>
      )}
      <p className="mt-3 text-[11px] text-slate-400">
        Сохранение — общей кнопкой сверху
      </p>
    </section>
  );
}


