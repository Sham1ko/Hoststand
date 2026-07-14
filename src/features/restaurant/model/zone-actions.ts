import { getBoundedZoneRect } from "@/lib/floor-plan/geometry";
import type { TableZone } from "@/entities/zone/model/types";

import type { RestaurantState } from "./types";

export type ZoneDetails = Pick<TableZone, "name" | "color"> & {
  rect: NonNullable<TableZone["rect"]>;
};

function hasValidZoneDetails(details: ZoneDetails) {
  return (
    details.name.trim().length > 0 &&
    /^#[0-9a-f]{6}$/i.test(details.color) &&
    Number.isFinite(details.rect.x) &&
    Number.isFinite(details.rect.y) &&
    Number.isFinite(details.rect.w) &&
    Number.isFinite(details.rect.h)
  );
}

export function createRestaurantZone(
  state: RestaurantState,
  zone: TableZone,
) {
  if (
    !zone.rect ||
    state.zones.some((item) => item.id === zone.id) ||
    !state.floors.some((floor) => floor.id === zone.floorId && floor.isActive) ||
    !hasValidZoneDetails({ ...zone, rect: zone.rect })
  ) {
    return null;
  }

  return {
    ...state,
    zones: [
      ...state.zones,
      {
        ...zone,
        name: zone.name.trim(),
        rect: getBoundedZoneRect(zone.rect, true),
      },
    ],
  };
}

export function updateRestaurantZone(
  state: RestaurantState,
  zoneId: string,
  details: ZoneDetails,
) {
  const zone = state.zones.find((item) => item.id === zoneId);

  if (!zone || !hasValidZoneDetails(details)) return null;

  const nextZone = {
    ...zone,
    name: details.name.trim(),
    color: details.color,
    rect: getBoundedZoneRect(details.rect, true),
  };

  if (
    zone.name === nextZone.name &&
    zone.color === nextZone.color &&
    zone.rect?.x === nextZone.rect.x &&
    zone.rect?.y === nextZone.rect.y &&
    zone.rect?.w === nextZone.rect.w &&
    zone.rect?.h === nextZone.rect.h
  ) {
    return null;
  }

  return {
    ...state,
    zones: state.zones.map((item) => (item.id === zoneId ? nextZone : item)),
  };
}

export function deleteRestaurantZone(state: RestaurantState, zoneId: string) {
  if (!state.zones.some((zone) => zone.id === zoneId)) return null;

  return {
    ...state,
    zones: state.zones.filter((zone) => zone.id !== zoneId),
    tables: state.tables.map((table) =>
      table.zoneId === zoneId ? { ...table, zoneId: undefined } : table,
    ),
  };
}
