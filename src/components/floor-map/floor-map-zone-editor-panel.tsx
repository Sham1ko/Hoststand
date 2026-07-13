import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import type { TableZone } from "@/features/floor-plan/model/types";
import type { ZoneDetails } from "@/features/restaurant/model/zone-actions";

const fieldClassName =
  "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const labelClassName = "flex flex-col gap-1 text-xs font-medium text-slate-600";

type ZoneFormValues = {
  name: string;
  color: string;
  width: number;
  height: number;
};

function getZoneFormValues(zone: TableZone): ZoneFormValues {
  return {
    name: zone.name,
    color: zone.color,
    width: zone.rect?.w ?? 0,
    height: zone.rect?.h ?? 0,
  };
}

type FloorMapZoneEditorPanelProps = {
  zone: TableZone;
  onSave: (details: ZoneDetails) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
};

export function FloorMapZoneEditorPanel({
  zone,
  onSave,
  onDelete,
}: FloorMapZoneEditorPanelProps) {
  const [error, setError] = useState<string>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ZoneFormValues>({
    defaultValues: getZoneFormValues(zone),
  });

  useEffect(() => {
    reset(getZoneFormValues(zone));
    setError(undefined);
  }, [reset, zone]);

  const saveZone = async (values: ZoneFormValues) => {
    if (!zone.rect) return;

    setError(undefined);
    const updated = await onSave({
      name: values.name,
      color: values.color,
      rect: {
        ...zone.rect,
        w: values.width,
        h: values.height,
      },
    });

    if (!updated) setError("Проверьте параметры зоны");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить зону «${zone.name}»?`)) return;

    await onDelete();
  };

  return (
    <form
      aria-label={`Свойства зоны ${zone.name}`}
      className="absolute top-4 left-4 z-10 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg"
      onSubmit={handleSubmit(saveZone)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-slate-950">
          Зона
        </h3>
        <Button
          type="button"
          variant="destructive"
          size="icon-sm"
          aria-label="Удалить зону"
          title="Удалить зону"
          onClick={() => void handleDelete()}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <label className={labelClassName}>
        Название
        <input
          type="text"
          required
          className={fieldClassName}
          {...register("name")}
        />
      </label>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className={labelClassName}>
          Цвет
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded-md border border-slate-200 bg-white p-1"
            {...register("color")}
          />
        </label>
        <label className={labelClassName}>
          Ширина
          <input
            type="number"
            min={120}
            required
            className={fieldClassName}
            {...register("width", { valueAsNumber: true })}
          />
        </label>
      </div>

      <label className={`mt-2 ${labelClassName}`}>
        Длина
        <input
          type="number"
          min={120}
          required
          className={fieldClassName}
          {...register("height", { valueAsNumber: true })}
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

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
