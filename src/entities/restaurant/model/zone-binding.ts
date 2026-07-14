import type { Point } from "@/lib/floor-plan/geometry";
import type { DiningTable } from "@/entities/table/model/types";
import type { TableZone } from "@/entities/zone/model/types";

export function getZoneIdAtPosition(
  zones: readonly TableZone[],
  floorId: string,
  position: Point,
) {
  return [...zones]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .find((zone) => {
      if (!zone.isActive || zone.floorId !== floorId || !zone.rect) {
        return false;
      }

      return (
        position.x >= zone.rect.x &&
        position.x <= zone.rect.x + zone.rect.w &&
        position.y >= zone.rect.y &&
        position.y <= zone.rect.y + zone.rect.h
      );
    })?.id;
}

// Recomputes which zone owns each table by its position. A manual binding to
// a zone without an area is kept as is. Returns the same array when nothing
// changed.
export function rebindTablesToZones(
  zones: readonly TableZone[],
  tables: readonly DiningTable[],
) {
  let hasChanges = false;
  const nextTables = tables.map((table) => {
    const boundZone = zones.find((zone) => zone.id === table.zoneId);

    if (boundZone && !boundZone.rect) return table;

    const zoneId = getZoneIdAtPosition(zones, table.floorId, {
      x: table.layout.x,
      y: table.layout.y,
    });

    if (table.zoneId === zoneId) return table;

    hasChanges = true;

    return { ...table, zoneId };
  });

  return hasChanges ? nextTables : tables;
}
