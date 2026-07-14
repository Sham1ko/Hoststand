import type { TableZone } from "@/entities/zone/model/types";
import { getZoneIdAtPosition } from "@/entities/restaurant/model/zone-binding";
import type { RestaurantState } from "@/entities/restaurant/model/types";

import { diningTableSeed, tableFloorSeed } from "./floor-plan-seed";
import { createReservationsSeed } from "./reservations-seed";

const tableZoneSeed: readonly TableZone[] = [
  {
    id: "zone-main-hall",
    floorId: "floor-1",
    name: "Основной зал",
    color: "#60a5fa",
    sortOrder: 1,
    isActive: true,
    rect: { x: 80, y: 80, w: 800, h: 600 },
  },
  {
    id: "zone-window",
    floorId: "floor-1",
    name: "У окна",
    color: "#f59e0b",
    sortOrder: 2,
    isActive: true,
    rect: { x: 950, y: 80, w: 600, h: 600 },
  },
  {
    id: "zone-second-hall",
    floorId: "floor-2",
    name: "Второй зал",
    color: "#8b5cf6",
    sortOrder: 1,
    isActive: true,
    rect: { x: 120, y: 100, w: 800, h: 800 },
  },
  {
    id: "zone-private-room",
    floorId: "floor-2",
    name: "Приватный зал",
    color: "#ec4899",
    sortOrder: 2,
    isActive: true,
    rect: { x: 950, y: 100, w: 500, h: 800 },
  },
  {
    id: "zone-terrace",
    floorId: "summer",
    name: "Терраса",
    color: "#10b981",
    sortOrder: 1,
    isActive: true,
    rect: { x: 100, y: 100, w: 1350, h: 300 },
  },
  {
    id: "zone-garden",
    floorId: "summer",
    name: "Сад",
    color: "#14b8a6",
    sortOrder: 2,
    isActive: true,
    rect: { x: 100, y: 500, w: 1350, h: 350 },
  },
];

function createTables(zones: readonly TableZone[]) {
  return diningTableSeed.map((table) => ({
    ...table,
    zoneId: getZoneIdAtPosition(zones, table.floorId, {
      x: table.layout.x,
      y: table.layout.y,
    }),
    layout: { ...table.layout },
  }));
}

export function createRestaurantSeed(): RestaurantState {
  const floors = tableFloorSeed.map((floor) => ({ ...floor }));
  const zones = tableZoneSeed.map((zone) => ({
    ...zone,
    rect: zone.rect ? { ...zone.rect } : undefined,
  }));
  const activeFloorId =
    floors
      .filter((floor) => floor.isActive)
      .sort((left, right) => left.sortOrder - right.sortOrder)[0]?.id ?? "";

  return {
    floors,
    zones,
    tables: createTables(zones),
    reservations: createReservationsSeed().map((reservation) => ({
      ...reservation,
    })),
    activeFloorId,
  };
}
