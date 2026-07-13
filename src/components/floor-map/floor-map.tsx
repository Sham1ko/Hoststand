type MockTableShape = "round" | "square" | "rect";

type MockTable = {
  id: string;
  number: number;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: MockTableShape;
};

const mockTables: readonly MockTable[] = [
  {
    id: "table-1",
    number: 1,
    capacity: 2,
    x: 260,
    y: 220,
    width: 120,
    height: 120,
    rotation: 0,
    shape: "square",
  },
  {
    id: "table-2",
    number: 2,
    capacity: 4,
    x: 570,
    y: 220,
    width: 150,
    height: 150,
    rotation: 0,
    shape: "round",
  },
  {
    id: "table-3",
    number: 3,
    capacity: 6,
    x: 940,
    y: 220,
    width: 250,
    height: 130,
    rotation: 0,
    shape: "rect",
  },
  {
    id: "table-4",
    number: 4,
    capacity: 4,
    x: 1320,
    y: 230,
    width: 150,
    height: 150,
    rotation: 12,
    shape: "square",
  },
  {
    id: "table-5",
    number: 5,
    capacity: 4,
    x: 330,
    y: 560,
    width: 150,
    height: 150,
    rotation: 0,
    shape: "round",
  },
  {
    id: "table-6",
    number: 6,
    capacity: 8,
    x: 760,
    y: 550,
    width: 310,
    height: 150,
    rotation: -8,
    shape: "rect",
  },
  {
    id: "table-7",
    number: 7,
    capacity: 2,
    x: 1200,
    y: 560,
    width: 120,
    height: 120,
    rotation: 0,
    shape: "square",
  },
  {
    id: "table-8",
    number: 8,
    capacity: 6,
    x: 500,
    y: 820,
    width: 250,
    height: 130,
    rotation: 7,
    shape: "rect",
  },
  {
    id: "table-9",
    number: 9,
    capacity: 4,
    x: 1050,
    y: 820,
    width: 150,
    height: 150,
    rotation: 0,
    shape: "round",
  },
];

function formatCapacity(capacity: number) {
  const lastTwoDigits = capacity % 100;
  const lastDigit = capacity % 10;

  if (lastDigit === 1 && lastTwoDigits !== 11) return `${capacity} место`;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return `${capacity} места`;
  }

  return `${capacity} мест`;
}

function MockTableNode({ table }: { table: MockTable }) {
  const isRound = table.shape === "round";

  return (
    <g transform={`translate(${table.x} ${table.y}) rotate(${table.rotation})`}>
      {isRound ? (
        <ellipse
          rx={table.width / 2}
          ry={table.height / 2}
          className="fill-orange-50 stroke-orange-400"
          strokeWidth={4}
        />
      ) : (
        <rect
          x={-table.width / 2}
          y={-table.height / 2}
          width={table.width}
          height={table.height}
          rx={table.shape === "square" ? 22 : 28}
          className="fill-orange-50 stroke-orange-400"
          strokeWidth={4}
        />
      )}

      <g transform={`rotate(${-table.rotation})`} className="select-none">
        <text
          textAnchor="middle"
          y={-4}
          className="fill-slate-900 text-[34px] font-semibold"
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

export function FloorMap() {
  return (
    <section
      aria-label="Карта столов"
      className="min-w-0 flex-1 bg-slate-100 p-5"
    >
      <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="floor-map-title floor-map-description"
          className="size-full"
        >
          <title id="floor-map-title">Карта столов ресторана</title>
          <desc id="floor-map-description">
            Моковая схема зала с девятью столами
          </desc>

          <defs>
            <pattern
              id="floor-map-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1.5" cy="1.5" r="1.5" className="fill-slate-200" />
            </pattern>
          </defs>

          <rect width="1600" height="1000" className="fill-white" />
          <rect width="1600" height="1000" fill="url(#floor-map-grid)" />

          <g aria-label="Столы">
            {mockTables.map((table) => (
              <MockTableNode key={table.id} table={table} />
            ))}
          </g>
        </svg>
      </div>
    </section>
  );
}
