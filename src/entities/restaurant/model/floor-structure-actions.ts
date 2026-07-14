import type { FloorStructureInput } from "@/entities/restaurant/model/schemas";
import type { RestaurantState } from "@/entities/restaurant/model/types";
import { rebindTablesToZones } from "@/entities/restaurant/model/zone-binding";

function hasDuplicates(values: readonly string[]) {
  return new Set(values).size !== values.length;
}

export function updateRestaurantFloorStructure(
  state: RestaurantState,
  input: FloorStructureInput,
) {
  const floorIds = new Set(input.floors.map((floor) => floor.id));
  const activeFloor = input.floors.find(
    (floor) => floor.id === input.activeFloorId && floor.isActive,
  );

  if (
    !activeFloor ||
    hasDuplicates(input.floors.map((floor) => floor.id)) ||
    hasDuplicates(input.zones.map((zone) => zone.id)) ||
    input.floors.some((floor) => floor.name.trim().length === 0) ||
    input.zones.some(
      (zone) => zone.name.trim().length === 0 || !floorIds.has(zone.floorId),
    ) ||
    state.tables.some((table) => !floorIds.has(table.floorId))
  ) {
    return null;
  }

  const floors = input.floors.map((floor) => ({
    ...floor,
    name: floor.name.trim(),
  }));
  const zones = input.zones.map((zone) => ({
    ...zone,
    name: zone.name.trim(),
  }));

  return {
    ...state,
    floors,
    zones,
    tables: [...rebindTablesToZones(zones, state.tables)],
    activeFloorId: input.activeFloorId,
  };
}
