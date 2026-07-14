import type {
  PointerEventHandler,
  RefObject,
  WheelEventHandler,
} from "react";

import type {
  Camera,
  Size,
} from "@/lib/floor-plan/geometry";
import type { DiningTable } from "@/entities/table/model/types";
import type { TableZone } from "@/entities/zone/model/types";
import { getDisplayedTableStatus } from "@/features/reservations/model/selectors";

import type { TableDragPreview } from "../hooks/use-floor-map-editor";
import type { ZoneDragPreview } from "../hooks/use-floor-map-zone-editor";
import { TableNode } from "./table-node";
import { ZoneNode } from "./zone-node";

type FloorMapCanvasProps = {
  svgRef: RefObject<SVGSVGElement | null>;
  viewport: Size;
  camera: Camera;
  floorName?: string;
  tables: DiningTable[];
  zones: TableZone[];
  reservedTableIds: ReadonlySet<string>;
  tableDragPreview: TableDragPreview | null;
  zoneDragPreview: ZoneDragPreview | null;
  isEditing: boolean;
  isTableEditing: boolean;
  isZoneEditing: boolean;
  selectedTableId: string | null;
  selectedZoneId: string | null;
  focusedReservationTableId: string | null;
  onTableFocus: (tableId: string) => void;
  onCanvasPointerDown: PointerEventHandler<SVGSVGElement>;
  onCanvasPointerMove: PointerEventHandler<SVGSVGElement>;
  onCanvasPointerEnd: PointerEventHandler<SVGSVGElement>;
  onWheel: WheelEventHandler<SVGSVGElement>;
  onTablePointerDown: (
    event: Parameters<PointerEventHandler<SVGGElement>>[0],
    table: DiningTable,
  ) => void;
  onTablePointerMove: PointerEventHandler<SVGGElement>;
  onTablePointerUp: PointerEventHandler<SVGGElement>;
  onTablePointerCancel: PointerEventHandler<SVGGElement>;
  onZonePointerDown: (
    event: Parameters<PointerEventHandler<SVGGElement>>[0],
    zone: TableZone,
  ) => void;
  onZonePointerMove: PointerEventHandler<SVGGElement>;
  onZonePointerUp: PointerEventHandler<SVGGElement>;
  onZonePointerCancel: PointerEventHandler<SVGGElement>;
};

export function FloorMapCanvas({
  svgRef,
  viewport,
  camera,
  floorName,
  tables,
  zones,
  reservedTableIds,
  tableDragPreview,
  zoneDragPreview,
  isEditing,
  isTableEditing,
  isZoneEditing,
  selectedTableId,
  selectedZoneId,
  focusedReservationTableId,
  onTableFocus,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerEnd,
  onWheel,
  onTablePointerDown,
  onTablePointerMove,
  onTablePointerUp,
  onTablePointerCancel,
  onZonePointerDown,
  onZonePointerMove,
  onZonePointerUp,
  onZonePointerCancel,
}: FloorMapCanvasProps) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewport.width || 1} ${viewport.height || 1}`}
      preserveAspectRatio="none"
      role="img"
      aria-labelledby="floor-map-title floor-map-description"
      className="size-full cursor-grab touch-none select-none active:cursor-grabbing"
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerEnd}
      onPointerCancel={onCanvasPointerEnd}
      onWheel={onWheel}
    >
      <title id="floor-map-title">{`Карта столов: ${
        floorName ?? "этаж не выбран"
      }`}</title>
      <desc id="floor-map-description">
        {`На плане отображено столов: ${tables.length}, зон: ${zones.length}`}
      </desc>

      <defs>
        <pattern
          id="floor-map-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="1.5" className="fill-slate-200" />
        </pattern>
      </defs>

      <rect width="100%" height="100%" className="fill-slate-50" />

      <g
        transform={`translate(${camera.offsetX} ${camera.offsetY}) scale(${camera.scale})`}
      >
        <rect
          width="1600"
          height="1000"
          rx="32"
          className="fill-white"
        />
        <rect
          width="1600"
          height="1000"
          rx="32"
          fill="url(#floor-map-grid)"
          className="stroke-slate-200"
          strokeWidth="1.5"
        />

        <g aria-label="Зоны">
          {zones.map((zone) => (
            <ZoneNode
              key={zone.id}
              zone={zone}
              rect={
                zoneDragPreview?.zoneId === zone.id
                  ? zoneDragPreview
                  : zone.rect
              }
              isEditing={isZoneEditing}
              isSelected={isZoneEditing && zone.id === selectedZoneId}
              onPointerDown={(event) => onZonePointerDown(event, zone)}
              onPointerMove={onZonePointerMove}
              onPointerUp={onZonePointerUp}
              onPointerCancel={onZonePointerCancel}
            />
          ))}
        </g>

        <g aria-label="Столы">
          {tables.map((table) => {
            const previewPosition =
              tableDragPreview?.tableId === table.id
                ? tableDragPreview
                : undefined;
            const displayedTable = previewPosition
              ? {
                  ...table,
                  layout: {
                    ...table.layout,
                    x: previewPosition.x,
                    y: previewPosition.y,
                  },
                }
              : table;

            return (
              <TableNode
                key={table.id}
                table={{
                  ...displayedTable,
                  status: getDisplayedTableStatus(
                    displayedTable,
                    reservedTableIds,
                  ),
                }}
                isEditing={isTableEditing}
                isSelected={
                  (isTableEditing && table.id === selectedTableId) ||
                  (!isEditing && table.id === focusedReservationTableId)
                }
                isInteractionDisabled={isZoneEditing}
                onPointerDown={(event) => {
                  if (!isEditing) {
                    onTableFocus(table.id);
                    return;
                  }

                  onTablePointerDown(event, displayedTable);
                }}
                onPointerMove={onTablePointerMove}
                onPointerUp={onTablePointerUp}
                onPointerCancel={onTablePointerCancel}
              />
            );
          })}
        </g>
      </g>
    </svg>
  );
}
