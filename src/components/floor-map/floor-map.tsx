"use client";

import { useState } from "react";

import type {
  DiningTable,
  TableFloor,
} from "@/features/floor-plan/model/types";

import { TableNode } from "./table-node";

type FloorMapProps = {
  floors: readonly TableFloor[];
  tables: readonly DiningTable[];
};

export function FloorMap({ floors, tables }: FloorMapProps) {
  const activeFloors = floors.filter((floor) => floor.isActive);
  const [selectedFloorId, setSelectedFloorId] = useState(
    () => activeFloors[0]?.id ?? "",
  );
  const selectedFloor = activeFloors.find(
    (floor) => floor.id === selectedFloorId,
  );
  const visibleTables = tables.filter(
    (table) => table.floorId === selectedFloorId,
  );

  return (
    <section
      aria-label="Карта столов"
      className="min-w-0 flex-1 bg-slate-100 p-5"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">План зала</h2>

          <div
            role="tablist"
            aria-label="Этажи ресторана"
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
          >
            {activeFloors.map((floor) => {
              const isSelected = floor.id === selectedFloorId;

              return (
                <button
                  key={floor.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => setSelectedFloorId(floor.id)}
                >
                  {floor.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <svg
            viewBox="0 0 1600 1000"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-labelledby="floor-map-title floor-map-description"
            className="size-full"
          >
            <title id="floor-map-title">{`Карта столов: ${
              selectedFloor?.name ?? "этаж не выбран"
            }`}</title>
            <desc id="floor-map-description">
              {`На плане отображено столов: ${visibleTables.length}`}
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
              {visibleTables.map((table) => (
                <TableNode key={table.id} table={table} />
              ))}
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
