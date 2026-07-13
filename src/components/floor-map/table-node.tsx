import type {
  DiningTable,
  TableStatus,
} from "@/features/floor-plan/model/types";
import { Users } from "lucide-react";
import type { PointerEvent } from "react";

const statusStyles: Record<
  TableStatus,
  { fill: string; stroke: string; text: string }
> = {
  FREE: { fill: "#ecfdf5", stroke: "#10b981", text: "#047857" },
  OCCUPIED: { fill: "#fff1f2", stroke: "#fb7185", text: "#be123c" },
  RESERVED: { fill: "#fffbeb", stroke: "#f59e0b", text: "#b45309" },
  BANQUET: { fill: "#f5f3ff", stroke: "#8b5cf6", text: "#6d28d9" },
  MANUAL_BLOCKED: { fill: "#f1f5f9", stroke: "#64748b", text: "#475569" },
  INACTIVE: { fill: "#f8fafc", stroke: "#94a3b8", text: "#64748b" },
};

function formatCapacity(capacity: number) {
  const lastTwoDigits = capacity % 100;
  const lastDigit = capacity % 10;

  if (lastDigit === 1 && lastTwoDigits !== 11) return `${capacity} место`;
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return `${capacity} места`;
  }

  return `${capacity} мест`;
}

type TableNodeProps = {
  table: DiningTable;
  isEditing?: boolean;
  isSelected?: boolean;
  isInteractionDisabled?: boolean;
  onPointerDown?: (event: PointerEvent<SVGGElement>) => void;
  onPointerMove?: (event: PointerEvent<SVGGElement>) => void;
  onPointerUp?: (event: PointerEvent<SVGGElement>) => void;
  onPointerCancel?: (event: PointerEvent<SVGGElement>) => void;
};

export function TableNode({
  table,
  isEditing = false,
  isSelected = false,
  isInteractionDisabled = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: TableNodeProps) {
  const { x, y, w, h, rotation, shape } = table.layout;
  const style = statusStyles[table.status];
  const isRound = shape === "round";
  const isInactive = table.status === "INACTIVE";

  return (
    <g
      data-table-node
      aria-label={`Стол №${table.number}, ${formatCapacity(table.capacity)}`}
      transform={`translate(${x} ${y}) rotate(${rotation})`}
      opacity={isInactive ? 0.65 : 1}
      className={isEditing ? "cursor-move" : undefined}
      pointerEvents={isInteractionDisabled ? "none" : undefined}
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

      <g transform={`rotate(${-rotation})`} className="select-none">
        <text
          textAnchor="middle"
          y={-4}
          fill={style.text}
          className="text-[34px] font-semibold"
        >
          №{table.number}
        </text>
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
