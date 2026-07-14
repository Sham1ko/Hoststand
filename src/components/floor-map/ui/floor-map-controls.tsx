import { Maximize, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type FloorMapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
};

export function FloorMapControls({
  onZoomIn,
  onZoomOut,
  onFit,
}: FloorMapControlsProps) {
  return (
    <div
      aria-label="Управление масштабом карты"
      className="absolute right-4 bottom-4 flex overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Уменьшить масштаб"
        title="Уменьшить масштаб"
        onClick={onZoomOut}
      >
        <Minus aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Вписать карту в экран"
        title="Вписать карту в экран"
        className="border-x border-slate-200"
        onClick={onFit}
      >
        <Maximize aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Увеличить масштаб"
        title="Увеличить масштаб"
        onClick={onZoomIn}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}


