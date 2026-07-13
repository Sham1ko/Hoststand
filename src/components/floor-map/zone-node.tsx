import type { PointerEvent } from "react";

import type { TableZone } from "@/features/floor-plan/model/types";

type ZoneNodeProps = {
  zone: TableZone;
  rect?: NonNullable<TableZone["rect"]>;
  isEditing?: boolean;
  isSelected?: boolean;
  onPointerDown?: (event: PointerEvent<SVGGElement>) => void;
  onPointerMove?: (event: PointerEvent<SVGGElement>) => void;
  onPointerUp?: (event: PointerEvent<SVGGElement>) => void;
  onPointerCancel?: (event: PointerEvent<SVGGElement>) => void;
};

export function ZoneNode({
  zone,
  rect = zone.rect,
  isEditing = false,
  isSelected = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: ZoneNodeProps) {
  if (!rect) return null;

  return (
    <g
      data-zone-node
      aria-label={zone.name}
      transform={`translate(${rect.x} ${rect.y})`}
      pointerEvents={isEditing ? "all" : "none"}
      className={isEditing ? "cursor-move" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <rect
        width={rect.w}
        height={rect.h}
        rx={44}
        fill={zone.color}
        fillOpacity={0.1}
        stroke={zone.color}
        strokeOpacity={isSelected ? 0.9 : 0.5}
        strokeWidth={isSelected ? 3 : 1.5}
        strokeDasharray="7 5"
      />
      <text
        x={20}
        y={38}
        fill={zone.color}
        className="pointer-events-none text-[26px] font-semibold"
      >
        {zone.name}
      </text>
      {isSelected && (
        <rect
          data-zone-resize-handle
          x={rect.w - 18}
          y={rect.h - 18}
          width={36}
          height={36}
          rx={8}
          fill={zone.color}
          className="cursor-se-resize"
        />
      )}
    </g>
  );
}
