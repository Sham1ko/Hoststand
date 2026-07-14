import { useId, useMemo } from "react";
import { Layers3 } from "lucide-react";

import type { TableFloor } from "@/entities/floor/model/types";
import type { DiningTable } from "@/entities/table/model/types";

type FloorSwitcherProps = {
  floors: readonly TableFloor[];
  tables: readonly DiningTable[];
  activeFloorId: string;
  onFloorChange: (floorId: string) => void;
};

export function FloorSwitcher({
  floors,
  tables,
  activeFloorId,
  onFloorChange,
}: FloorSwitcherProps) {
  const groupName = useId();
  const tableCountByFloor = useMemo(
    () =>
      tables.reduce<Record<string, number>>((counts, table) => {
        counts[table.floorId] = (counts[table.floorId] ?? 0) + 1;
        return counts;
      }, {}),
    [tables],
  );

  if (floors.length === 0) return null;

  return (
    <fieldset
      className="flex min-w-0 max-w-full items-stretch overflow-hidden rounded-xl border border-slate-200/70 bg-slate-100/80 p-0.5 shadow-inner shadow-slate-200/25"
    >
      <legend className="sr-only">Этаж ресторана</legend>

      <div
        aria-hidden="true"
        className="hidden h-8 w-8 shrink-0 items-center justify-center border-r border-slate-200/80 text-slate-600 sm:flex"
      >
        <Layers3
          className="size-4.5"
          strokeWidth={2}
        />
      </div>

      <div
        className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {floors.map((floor) => {
          const isSelected = floor.id === activeFloorId;
          const tableCount = tableCountByFloor[floor.id] ?? 0;

          return (
            <label
              key={floor.id}
              className="group relative min-w-[7.5rem] flex-1 shrink-0 cursor-pointer touch-manipulation select-none"
            >
              <input
                type="radio"
                name={groupName}
                value={floor.id}
                checked={isSelected}
                aria-label={`${floor.name}, ${formatTableCount(tableCount)}`}
                className="peer sr-only"
                onChange={() => onFloorChange(floor.id)}
              />
              <span
                aria-hidden="true"
                className={`flex min-h-8 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold whitespace-nowrap transition-[color,background-color,box-shadow] duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/45 peer-focus-visible:ring-offset-1 motion-reduce:transition-none ${
                  isSelected
                    ? "bg-white text-slate-950 shadow-[0_5px_16px_-9px_rgba(15,23,42,0.5)]"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                }`}
              >
                <span>{floor.name}</span>
                <span
                  className={`min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums ${
                    isSelected
                      ? "bg-slate-100 text-slate-900"
                      : "bg-white/70 text-slate-500"
                  }`}
                >
                  {tableCount}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function formatTableCount(count: number) {
  const remainder100 = count % 100;
  const remainder10 = count % 10;

  if (remainder100 >= 11 && remainder100 <= 14) return `${count} столов`;
  if (remainder10 === 1) return `${count} стол`;
  if (remainder10 >= 2 && remainder10 <= 4) return `${count} стола`;
  return `${count} столов`;
}
