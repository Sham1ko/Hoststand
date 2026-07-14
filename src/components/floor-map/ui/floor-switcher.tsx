import { Armchair, Layers3 } from "lucide-react";

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
  const tableCountByFloor = tables.reduce<Record<string, number>>(
    (counts, table) => {
      counts[table.floorId] = (counts[table.floorId] ?? 0) + 1;
      return counts;
    },
    {},
  );

  return (
    <section
      aria-labelledby="floor-switcher-title"
      className="absolute top-4 right-4 z-20 w-56 max-w-[calc(100%-2rem)] rounded-2xl border border-white/80 bg-white/90 p-2.5 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.5)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5 px-2 py-2">
        <Layers3
          aria-hidden="true"
          className="size-5 text-slate-500"
          strokeWidth={2}
        />
        <h3
          id="floor-switcher-title"
          className="text-sm font-semibold tracking-tight text-slate-950"
        >
          Этажи
        </h3>
      </div>

      <div
        role="tablist"
        aria-label="Этажи ресторана"
        className="mt-1 space-y-1 rounded-xl bg-slate-100/80 p-1"
      >
        {floors.map((floor) => {
          const isSelected = floor.id === activeFloorId;
          const tableCount = tableCountByFloor[floor.id] ?? 0;

          return (
            <button
              key={floor.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`relative flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3.5 text-left transition-[color,background-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSelected
                  ? "bg-white pl-4.5 text-slate-950 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.55)] before:absolute before:top-2 before:bottom-2 before:left-1 before:w-1 before:rounded-full before:bg-slate-950"
                  : "text-slate-400 hover:bg-white/55 hover:text-slate-700 active:scale-[0.99]"
              }`}
              onClick={() => onFloorChange(floor.id)}
            >
              <span className="text-sm font-semibold">{floor.name}</span>
              <span
                aria-label={`${tableCount} столов`}
                className={`flex shrink-0 items-center gap-1.5 text-sm font-medium ${
                  isSelected ? "text-slate-700" : "text-slate-400"
                }`}
              >
                <Armchair aria-hidden="true" className="size-4" />
                <span>{tableCount}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
