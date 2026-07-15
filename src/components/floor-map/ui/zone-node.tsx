import type { PointerEvent } from "react";

import type { TableZone } from "@/entities/zone/model/types";

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

  const labelWidth = Math.min(
    200,
    Math.max(100, Array.from(zone.name).length * 11 + 42),
  );
  const labelX = Math.max(14, Math.min(40, rect.w - labelWidth - 14));

  return (
    <g
      data-zone-node
      aria-label={zone.name}
      transform={`translate(${rect.x} ${rect.y})`}
      pointerEvents="none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <rect
        width={rect.w}
        height={rect.h}
        rx={14}
        fill={zone.color}
        fillOpacity={0.1}
        stroke={zone.color}
        strokeOpacity={isSelected ? 0.9 : 0.5}
        strokeWidth={isSelected ? 3 : 1.5}
        strokeDasharray="7 5"
      />
      <g
        data-zone-drag-handle
        pointerEvents={isEditing ? "all" : "none"}
        className={isEditing ? "cursor-move" : undefined}
      >
        <rect
          x={labelX}
          y={-22}
          width={labelWidth}
          height={44}
          rx={22}
          fill={zone.color}
          style={{ filter: "drop-shadow(0 3px 3px rgb(15 23 42 / 0.14))" }}
        />
        <text
          x={labelX + labelWidth / 2}
          y={1}
          fill="white"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[22px] font-bold"
        >
          {zone.name}
        </text>
      </g>
      {isSelected && (
        <circle
          data-zone-resize-handle
          cx={rect.w}
          cy={rect.h}
          r={14}
          fill={zone.color}
          stroke="white"
          strokeWidth={6}
          pointerEvents={isEditing ? "all" : "none"}
          className="cursor-se-resize"
        />
      )}
    </g>
  );
}
