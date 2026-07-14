import { Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const shapeLabelId = useId();
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

  const selectShape = (shape: TableShape) => {
    setValues((currentValues) => ({ ...currentValues, shape }));
    onChange({ layout: { shape } });
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
