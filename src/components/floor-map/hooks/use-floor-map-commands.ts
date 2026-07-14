import { useCallback } from "react";

import type { CreateTableInput } from "@/entities/table/model/schemas";
import type { DiningTable } from "@/entities/table/model/types";
import type { CreateZoneInput } from "@/entities/zone/model/schemas";
import type { TableZone } from "@/entities/zone/model/types";

type UseFloorMapCommandsOptions = {
  activeFloorId: string;
  tables: readonly DiningTable[];
  visibleTableCount: number;
  visibleZones: readonly TableZone[];
  createTable: (
    input: CreateTableInput,
  ) => DiningTable | null | Promise<DiningTable | null>;
  createZone: (
    input: CreateZoneInput,
  ) => TableZone | null | Promise<TableZone | null>;
  selectTable: (tableId: string) => void;
  selectZone: (zoneId: string) => void;
};

export function useFloorMapCommands({
  activeFloorId,
  tables,
  visibleTableCount,
  visibleZones,
  createTable,
  createZone,
  selectTable,
  selectZone,
}: UseFloorMapCommandsOptions) {
  const createTableOnActiveFloor = useCallback(async () => {
    const offset = (visibleTableCount % 4) * 40;
    const table = await createTable({
      number: Math.max(0, ...tables.map((item) => item.number)) + 1,
      capacity: 4,
      floorId: activeFloorId,
      status: "FREE",
      layout: {
        x: 800 + offset,
        y: 500 + offset,
        w: 150,
        h: 150,
        rotation: 0,
        shape: "square",
      },
    });

    if (table) selectTable(table.id);
  }, [activeFloorId, createTable, selectTable, tables, visibleTableCount]);

  const createZoneOnActiveFloor = useCallback(async () => {
    const offset = (visibleZones.length % 4) * 40;
    const zone = await createZone({
      floorId: activeFloorId,
      name: `Новая зона ${visibleZones.length + 1}`,
      color: "#0ea5e9",
      sortOrder:
        Math.max(0, ...visibleZones.map((item) => item.sortOrder)) + 1,
      isActive: true,
      rect: {
        x: 560 + offset,
        y: 320 + offset,
        w: 400,
        h: 260,
      },
    });

    if (zone) selectZone(zone.id);
  }, [activeFloorId, createZone, selectZone, visibleZones]);

  return { createTableOnActiveFloor, createZoneOnActiveFloor };
}


