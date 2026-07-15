import { Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ZonePatchInput } from "@/entities/zone/model/schemas";
import type { TableZone } from "@/entities/zone/model/types";
import type { DiningTable } from "@/entities/table/model/types";

const zoneColors = [
  "#f97346",
  "#4ba3df",
  "#7c55e8",
  "#f0a52f",
  "#4fb487",
  "#e5487f",
  "#14a6a6",
  "#d94b4b",
];

const fieldClassName =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const labelClassName = "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

type ZoneFormValues = {
  name: string;
  color: string;
  width: string;
  height: string;
};

type FloorMapZoneEditorPanelProps = {
  zone: TableZone;
  tables: readonly DiningTable[];
  onChange: (patch: ZonePatchInput) => void;
  onClose: () => void;
  onDelete: () => void;
};

export function FloorMapZoneEditorPanel({
  zone,
  tables,
  onChange,
  onClose,
  onDelete,
}: FloorMapZoneEditorPanelProps) {
  const [edits, setEdits] = useState<Partial<ZoneFormValues>>({});
  const values: ZoneFormValues = {
    name: edits.name ?? zone.name,
    color: edits.color ?? zone.color,
    width: edits.width ?? String(zone.rect?.w ?? 0),
    height: edits.height ?? String(zone.rect?.h ?? 0),
  };

  const updateName = (name: string) => {
    setEdits((currentEdits) => ({ ...currentEdits, name }));

    if (name.trim()) onChange({ name });
  };

  const updateColor = (color: string) => {
    setEdits((currentEdits) => ({ ...currentEdits, color }));
    onChange({ color });
  };

  const updateSize = (field: "width" | "height", rawValue: string) => {
    setEdits((currentEdits) => ({
      ...currentEdits,
      [field]: rawValue,
    }));

    if (!zone.rect || rawValue.trim() === "") return;

    const value = Number(rawValue);

    if (!Number.isFinite(value) || value < 120) return;

    onChange({
      rect: {
        ...zone.rect,
        [field === "width" ? "w" : "h"]: value,
      },
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Удалить зону «${zone.name}»?`)) return;

    onDelete();
  };

  return (
    <section
      aria-label={`Свойства зоны ${zone.name}`}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
            Редактор зоны
          </p>
          <h2 className="mt-1 flex min-w-0 items-center gap-2 text-xl font-semibold tracking-tight text-slate-950">
            <span
              aria-hidden="true"
              className="size-3.5 shrink-0 rounded-full"
              style={{ backgroundColor: values.color }}
            />
            <span className="truncate">{values.name || "Без названия"}</span>
          </h2>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Закрыть редактор зоны"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label className={labelClassName}>
          Название
          <input
            type="text"
            required
            className={fieldClassName}
            value={values.name}
            onChange={(event) => updateName(event.target.value)}
          />
        </label>

        <fieldset className="mt-5">
          <legend className="text-xs font-medium text-slate-600">Цвет</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {zoneColors.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Выбрать цвет ${color}`}
                aria-pressed={values.color.toLowerCase() === color.toLowerCase()}
                className="size-10 rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-200 transition hover:scale-105 aria-pressed:ring-2 aria-pressed:ring-slate-700"
                style={{ backgroundColor: color }}
                onClick={() => updateColor(color)}
              />
            ))}

            <label className="relative size-10 cursor-pointer overflow-hidden rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-200 transition hover:scale-105 focus-within:ring-2 focus-within:ring-slate-700">
              <span
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "conic-gradient(from 90deg, #ef4444, #f59e0b, #84cc16, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)",
                }}
              />
              <input
                type="color"
                aria-label="Выбрать произвольный цвет зоны"
                value={values.color}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(event) => updateColor(event.target.value)}
              />
            </label>
          </div>
        </fieldset>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className={labelClassName}>
            Ширина
            <input
              type="number"
              min={120}
              required
              className={fieldClassName}
              value={values.width}
              onChange={(event) => updateSize("width", event.target.value)}
            />
          </label>
          <label className={labelClassName}>
            Длина
            <input
              type="number"
              min={120}
              required
              className={fieldClassName}
              value={values.height}
              onChange={(event) => updateSize("height", event.target.value)}
            />
          </label>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-slate-600">
            Столы в зоне ({tables.length})
          </p>
          {tables.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tables.map((table) => (
                <span
                  key={table.id}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                >
                  №{table.number}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">Пока нет столов</p>
          )}
        </div>

        <p className="mt-4 text-xs leading-5 text-slate-400">
          Столы привязываются к зоне по положению на карте: перетащите стол
          внутрь или наружу — привязка обновится автоматически.
        </p>
      </div>

      <div className="border-t border-slate-200 p-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleDelete}
        >
          <Trash2 aria-hidden="true" data-icon="inline-start" />
          Удалить зону
        </Button>
      </div>
    </section>
  );
}
