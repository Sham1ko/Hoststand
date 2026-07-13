import type {
  DiningTable,
  TableStatus,
} from "@/features/floor-plan/model/types";

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
};

export function TableNode({ table }: TableNodeProps) {
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
    >
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
        <text
          textAnchor="middle"
          y={32}
          className="fill-slate-500 text-[24px] font-medium"
        >
          {formatCapacity(table.capacity)}
        </text>
      </g>
    </g>
  );
}
