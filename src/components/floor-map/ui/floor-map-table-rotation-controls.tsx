import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { DiningTable } from "@/entities/table/model/types";
import {
  clamp,
  getRotatedTableHalfExtents,
  type Camera,
  type Size,
} from "@/lib/floor-plan/geometry";

import {
  normalizeTableRotation,
  rotateTableBy,
} from "../model/table-rotation";

const PANEL_WIDTH = 192;
const PANEL_HEIGHT = 40;
const PANEL_GAP = 16;
const VIEWPORT_PADDING = 8;

type FloorMapTableRotationControlsProps = {
  table: DiningTable;
  camera: Camera;
  viewport: Size;
  onRotationChange: (rotation: number) => void;
};

export function FloorMapTableRotationControls({
  table,
  camera,
  viewport,
  onRotationChange,
}: FloorMapTableRotationControlsProps) {
  const rotation = normalizeTableRotation(table.layout.rotation);
  const [rotationInput, setRotationInput] = useState(String(rotation));
  const halfExtents = getRotatedTableHalfExtents(table.layout);
  const centerX = camera.offsetX + table.layout.x * camera.scale;
  const centerY = camera.offsetY + table.layout.y * camera.scale;
  const left = clamp(
    centerX,
    PANEL_WIDTH / 2 + VIEWPORT_PADDING,
    viewport.width - PANEL_WIDTH / 2 - VIEWPORT_PADDING,
  );
  const top = clamp(
    centerY + halfExtents.y * camera.scale + PANEL_GAP,
    VIEWPORT_PADDING,
    Math.max(VIEWPORT_PADDING, viewport.height - PANEL_HEIGHT - VIEWPORT_PADDING),
  );

  useEffect(() => {
    setRotationInput(String(rotation));
  }, [rotation]);

  const updateExactRotation = (rawValue: string) => {
    setRotationInput(rawValue);

    if (rawValue.trim() === "") return;

    const nextRotation = Number(rawValue);

    if (!Number.isFinite(nextRotation) || nextRotation < 0 || nextRotation > 360) {
      return;
    }

    onRotationChange(nextRotation);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div
        data-table-rotation-panel
        aria-label={`Поворот стола ${table.number}`}
        className="pointer-events-auto absolute flex h-10 w-48 items-center gap-0.5 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)] backdrop-blur-sm"
        style={{ left, top, transform: "translateX(-50%)" }}
      >
        <Button
          type="button"
          variant="ghost"
          size="lg"
          aria-label="Повернуть стол на 15 градусов против часовой стрелки"
          className="px-2 font-semibold tabular-nums text-slate-600"
          onClick={() => onRotationChange(rotateTableBy(rotation, -15))}
        >
          −15°
        </Button>

        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Точный угол поворота</span>
          <input
            type="number"
            min={0}
            max={360}
            step={1}
            inputMode="decimal"
            aria-label="Точный угол поворота"
            className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 pr-5 text-center text-xs font-semibold tabular-nums text-slate-700 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15"
            value={rotationInput}
            onChange={(event) => updateExactRotation(event.target.value)}
            onBlur={() => setRotationInput(String(rotation))}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-[10px] text-slate-400"
          >
            °
          </span>
        </label>

        <Button
          type="button"
          variant="ghost"
          size="lg"
          aria-label="Повернуть стол на 15 градусов по часовой стрелке"
          className="px-2 font-semibold tabular-nums text-slate-600"
          onClick={() => onRotationChange(rotateTableBy(rotation, 15))}
        >
          +15°
        </Button>
      </div>
    </div>
  );
}
