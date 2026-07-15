import type { DiningTable } from "@/entities/table/model/types";
import { formatTableCapacity } from "@/entities/table/model/format-table-capacity";
import { tableStatusAppearance } from "@/components/table-status-appearance";
import { Lock, RotateCw, Users } from "lucide-react";
import type { PointerEvent } from "react";

type TableNodeProps = {
  table: DiningTable;
  zoneColor?: string;
  cameraScale?: number;
  isEditing?: boolean;
  isSelected?: boolean;
  onPointerDown?: (event: PointerEvent<SVGGElement>) => void;
  onPointerMove?: (event: PointerEvent<SVGGElement>) => void;
  onPointerUp?: (event: PointerEvent<SVGGElement>) => void;
  onPointerCancel?: (event: PointerEvent<SVGGElement>) => void;
};

export function TableNode({
  table,
  zoneColor,
  cameraScale = 1,
  isEditing = false,
  isSelected = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: TableNodeProps) {
  const { x, y, w, h, rotation, shape } = table.layout;
  const style = tableStatusAppearance[table.status];
  const isRound = shape === "round";
  const isInactive = table.status === "INACTIVE";
  const isManuallyBlocked = table.status === "MANUAL_BLOCKED";
  const numberLabelWidth = String(table.number).length * 20;
  const rotationHandleY = -h / 2 - 54;

  return (
    <g
      data-table-node
      aria-label={`Стол №${table.number}, ${formatTableCapacity(table.capacity)}`}
      transform={`translate(${x} ${y}) rotate(${rotation})`}
      opacity={isInactive ? 0.65 : 1}
      className={isEditing ? "cursor-move" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {isSelected &&
        (isRound ? (
          <ellipse
            rx={w / 2 + 10}
            ry={h / 2 + 10}
            fill="none"
            stroke="#0f172a"
            strokeWidth={5}
            opacity={0.7}
          />
        ) : (
          <rect
            x={-w / 2 - 10}
            y={-h / 2 - 10}
            width={w + 20}
            height={h + 20}
            rx={shape === "square" ? 28 : 34}
            fill="none"
            stroke="#0f172a"
            strokeWidth={5}
            opacity={0.7}
          />
        ))}
      {isRound ? (
        <ellipse
          rx={w / 2}
          ry={h / 2}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={4}
          strokeDasharray={isInactive ? "12 10" : undefined}
        />
      ) : (
        <rect
          x={-w / 2}
          y={-h / 2}
          width={w}
          height={h}
          rx={shape === "square" ? 22 : 28}
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={4}
          strokeDasharray={isInactive ? "12 10" : undefined}
        />
      )}

      {isEditing && isSelected ? (
        <>
          <line
            aria-hidden="true"
            x1={0}
            y1={-h / 2 - 8}
            x2={0}
            y2={rotationHandleY}
            stroke="#64748b"
            strokeWidth={3}
            strokeDasharray="5 5"
          />
          <g
            data-table-rotate-handle
            aria-label="Повернуть стол"
            transform={`translate(0 ${rotationHandleY}) rotate(${-rotation}) scale(${1 / cameraScale})`}
            pointerEvents="all"
            className="cursor-grab active:cursor-grabbing"
          >
            <circle r={20} fill="transparent" />
            <circle
              r={15}
              fill="white"
              stroke="#475569"
              strokeWidth={2}
              style={{ filter: "drop-shadow(0 2px 3px rgb(15 23 42 / 0.18))" }}
            />
            <RotateCw
              aria-hidden="true"
              x={-8}
              y={-8}
              width={16}
              height={16}
              color="#334155"
              strokeWidth={2.5}
            />
          </g>
        </>
      ) : null}

      <g transform={`rotate(${-rotation})`} className="select-none">
        {!isEditing && zoneColor ? (
          <circle
            data-table-zone-indicator
            aria-hidden="true"
            cx={-numberLabelWidth / 2 - 14}
            cy={-16}
            r={8}
            fill={zoneColor}
            stroke="white"
            strokeWidth={4}
          />
        ) : null}
        <text
          textAnchor="middle"
          y={-4}
          fill={style.text}
          className="text-[34px] font-semibold"
        >
          {table.number}
        </text>
        {!isEditing && isManuallyBlocked ? (
          <Lock
            data-manual-blocked-indicator
            aria-hidden="true"
            x={numberLabelWidth / 2 + 6}
            y={-30}
            width={26}
            height={26}
            color={style.text}
            strokeWidth={2.5}
          />
        ) : null}
        <g className="text-slate-400">
          <Users
            x={-28}
            y={15}
            width={30}
            height={30}
            strokeWidth={2}
          />
          <text
            x={12}
            y={31}
            dominantBaseline="middle"
            className="fill-current text-[30px] font-medium"
          >
            {table.capacity}
          </text>
        </g>
      </g>
    </g>
  );
}
