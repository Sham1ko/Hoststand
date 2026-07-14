import type { TableStatus } from "@/entities/table/model/types";
import type { TableZone } from "@/entities/zone/model/types";

import { tableStatusAppearance } from "./table-status-appearance";

const tableStatuses: readonly TableStatus[] = [
  "FREE",
  "OCCUPIED",
  "RESERVED",
  "BANQUET",
  "MANUAL_BLOCKED",
  "INACTIVE",
];

type FloorMapLegendProps = {
  zones: readonly TableZone[];
  isEditing: boolean;
};

export function FloorMapLegend({ zones, isEditing }: FloorMapLegendProps) {
  const activeZones = zones
    .filter((zone) => zone.isActive)
    .toSorted((left, right) => left.sortOrder - right.sortOrder);

  return (
    <aside
      aria-label="Легенда карты"
      className={`absolute left-4 z-10 w-max max-w-[calc(100%_-_2rem)] rounded-xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.4)] backdrop-blur-sm transition-[bottom] ${
        isEditing ? "bottom-16" : "bottom-4"
      }`}
    >
      {activeZones.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {activeZones.map((zone) => (
              <span
                key={zone.id}
                className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-600"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-black/5"
                  style={{ backgroundColor: zone.color }}
                />
                <span className="max-w-24 truncate">{zone.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        className={
          activeZones.length > 0
            ? "mt-2 border-t border-slate-100 pt-2"
            : undefined
        }
      >
        <div className="flex flex-nowrap gap-x-3 overflow-x-auto">
          {tableStatuses.map((status) => {
            const appearance = tableStatusAppearance[status];

            return (
              <span
                key={status}
                className="flex shrink-0 items-center gap-1.5 text-[11px] whitespace-nowrap text-slate-600"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[3px] border"
                  style={{
                    backgroundColor: appearance.fill,
                    borderColor: appearance.stroke,
                  }}
                />
                {appearance.label}
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
