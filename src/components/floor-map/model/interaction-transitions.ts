import type { DiningTable, TablePosition } from "@/entities/table/model/types";
import type { TableZone } from "@/entities/zone/model/types";
import {
  getBoundedTablePosition,
  getBoundedZoneRect,
} from "@/lib/floor-plan/geometry";

type InteractionOutcome = "commit" | "cancel";

type TableDragSnapshot = {
  tableId: string;
  layout: DiningTable["layout"];
  position: TablePosition;
  hasMoved: boolean;
};

type ZoneDragSnapshot = {
  zoneId: string;
  rect: NonNullable<TableZone["rect"]>;
  hasMoved: boolean;
};

export function resolveTableDrag(
  drag: TableDragSnapshot,
  outcome: InteractionOutcome,
) {
  if (outcome === "cancel" || !drag.hasMoved) return null;

  return {
    tableId: drag.tableId,
    position: getBoundedTablePosition(drag.position, drag.layout, true),
  };
}

export function resolveZoneDrag(
  drag: ZoneDragSnapshot,
  outcome: InteractionOutcome,
) {
  if (outcome === "cancel" || !drag.hasMoved) return null;

  return {
    zoneId: drag.zoneId,
    rect: getBoundedZoneRect(drag.rect, true),
  };
}
