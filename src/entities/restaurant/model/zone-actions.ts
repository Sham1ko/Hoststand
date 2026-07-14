import { getBoundedZoneRect } from "@/lib/floor-plan/geometry";
import { rebindTablesToZones } from "@/entities/restaurant/model/zone-binding";
import type { RestaurantState } from "@/entities/restaurant/model/types";
import type {
  TableZone,
  ZoneDetails,
} from "@/entities/zone/model/types";

function withReboundTables(state: RestaurantState): RestaurantState {
  return {
    ...state,
    tables: rebindTablesToZones(state.zones, state.tables),
  };
}

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

  return withReboundTables({
    ...state,
    zones: [
      ...state.zones,
      {
        ...zone,
        name: zone.name.trim(),
        rect: getBoundedZoneRect(zone.rect, true),
      },
    ],
  });
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

  return withReboundTables({
    ...state,
    zones: state.zones.map((item) => (item.id === zoneId ? nextZone : item)),
  });
}

export function deleteRestaurantZone(state: RestaurantState, zoneId: string) {
  if (!state.zones.some((zone) => zone.id === zoneId)) return null;

  // Rebinding drops references to the removed zone and lets tables attach to
  // a zone that is still under them.
  return withReboundTables({
    ...state,
    zones: state.zones.filter((zone) => zone.id !== zoneId),
  });
}
