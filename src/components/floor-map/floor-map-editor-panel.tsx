import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import type {
  DiningTable,
  TableShape,
  TableStatus,
} from "@/features/floor-plan/model/types";
import type { TableDetails } from "@/features/restaurant-state/model/actions";

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
  number: number;
  capacity: number;
  shape: TableShape;
  rotation: number;
  width: number;
  height: number;
  status: TableStatus;
};

function getTableFormValues(table: DiningTable): TableFormValues {
  return {
    number: table.number,
    capacity: table.capacity,
    shape: table.layout.shape,
    rotation: table.layout.rotation,
    width: table.layout.w,
    height: table.layout.h,
    status: table.status,
  };
}

type FloorMapEditorPanelProps = {
  table: DiningTable;
  hasReservations: boolean;
  onSave: (details: TableDetails) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
};

export function FloorMapEditorPanel({
  table,
  hasReservations,
  onSave,
  onDelete,
}: FloorMapEditorPanelProps) {
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TableFormValues>({
    defaultValues: getTableFormValues(table),
  });

  useEffect(() => {
    reset(getTableFormValues(table));
    setError(undefined);
  }, [reset, table]);

  const saveTable = async (values: TableFormValues) => {
    setError(undefined);

    const updated = await onSave({
      number: values.number,
      capacity: values.capacity,
      status: values.status,
      layout: {
        shape: values.shape,
        rotation: values.rotation,
        w: values.width,
        h: values.height,
      },
    });

    if (!updated) {
      setError("Проверьте номер и параметры стола");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить стол №${table.number}?`)) return;

    await onDelete();
  };

  return (
    <form
      aria-label={`Свойства стола №${table.number}`}
      className="absolute top-4 left-4 z-10 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
      onSubmit={handleSubmit(saveTable)}
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
          onClick={() => void handleDelete()}
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
            {...register("number", { valueAsNumber: true })}
          />
        </label>
        <label className={labelClassName}>
          Мест
          <input
            type="number"
            min={1}
            required
            className={fieldClassName}
            {...register("capacity", { valueAsNumber: true })}
          />
        </label>
        <label className={labelClassName}>
          Форма
          <select
            className={fieldClassName}
            {...register("shape")}
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
            {...register("rotation", { valueAsNumber: true })}
          />
        </label>
        <label className={labelClassName}>
          Ширина
          <input
            type="number"
            min={40}
            required
            className={fieldClassName}
            {...register("width", { valueAsNumber: true })}
          />
        </label>
        <label className={labelClassName}>
          Высота
          <input
            type="number"
            min={40}
            required
            className={fieldClassName}
            {...register("height", { valueAsNumber: true })}
          />
        </label>
      </div>

      <label className={`mt-2 ${labelClassName}`}>
        Статус
        <select
          className={fieldClassName}
          {...register("status")}
        >
          {tableStatuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {hasReservations && (
        <p className="mt-2 text-xs text-slate-500">Есть связанные брони</p>
      )}

      <Button
        type="submit"
        size="sm"
        className="mt-3 w-full"
        disabled={isSubmitting}
      >
        <Save aria-hidden="true" data-icon="inline-start" />
        Сохранить
      </Button>
    </form>
  );
}
