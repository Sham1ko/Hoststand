"use client";

import { useState } from "react";

import { useRestaurant } from "@/features/restaurant-state/ui/restaurant-provider";
import {
  getDisplayedTableStatus,
  getReservedTableIds,
} from "@/features/reservations/model/selectors";

import { FloorMapControls } from "./floor-map-controls";
import {
  FloorMapEditorControls,
  type FloorMapEditorTool,
} from "./floor-map-editor-controls";
import { FloorMapEditorPanel } from "./floor-map-editor-panel";
import { FloorMapZoneEditorPanel } from "./floor-map-zone-editor-panel";
import { TableNode } from "./table-node";
import { useFloorMapCamera } from "./use-floor-map-camera";
import { useFloorMapEditor } from "./use-floor-map-editor";
import { useFloorMapZoneEditor } from "./use-floor-map-zone-editor";
import { ZoneNode } from "./zone-node";

export function FloorMap() {
  const {
    state,
    setActiveFloorId,
    updateTablePosition,
    createTable,
    updateTable,
    deleteTable,
    createZone,
    updateZone,
    updateZoneRect,
    deleteZone,
    reservationDate,
    focusedReservationTableId,
    setFocusedReservationTableId,
  } = useRestaurant();
  const [editorTool, setEditorTool] = useState<FloorMapEditorTool>("tables");
  const { floors, tables, activeFloorId } = state;
  const {
    svgRef,
    viewport,
    camera,
    fitCamera,
    zoomAtViewportCenter,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    finishPan,
  } = useFloorMapCamera();
  const {
    isEditing,
    selectedTableId,
    dragPreview,
    toggleEditing,
    selectTable,
    clearSelection,
    handleTablePointerDown,
    handleTablePointerMove,
    finishTableDrag,
    cancelTableDrag,
  } = useFloorMapEditor({
    camera,
    onTablePositionChange: (tableId, position) => {
      void updateTablePosition(tableId, position);
    },
  });
  const isTableEditing = isEditing && editorTool === "tables";
  const isZoneEditing = isEditing && editorTool === "zones";
  const {
    selectedZoneId,
    dragPreview: zoneDragPreview,
    selectZone,
    clearSelection: clearZoneSelection,
    handleZonePointerDown,
    handleZonePointerMove,
    finishZoneDrag,
    cancelZoneDrag,
  } = useFloorMapZoneEditor({
    camera,
    isEditing: isZoneEditing,
    onZoneRectChange: (zoneId, rect) => {
      void updateZoneRect(zoneId, rect);
    },
  });
  const activeFloors = floors.filter((floor) => floor.isActive);
  const selectedFloor = activeFloors.find(
    (floor) => floor.id === activeFloorId,
  );
  const visibleTables = tables.filter(
    (table) => table.floorId === activeFloorId,
  );
  const reservedTableIds = getReservedTableIds(
    state.reservations,
    reservationDate,
  );
  const visibleZones = state.zones.filter(
    (zone) => zone.floorId === activeFloorId && zone.isActive && zone.rect,
  );
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const selectedZone = state.zones.find((zone) => zone.id === selectedZoneId);

  const createTableOnActiveFloor = async () => {
    const offset = (visibleTables.length % 4) * 40;
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
  };

  const createZoneOnActiveFloor = async () => {
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
  };

  const selectEditorTool = (tool: FloorMapEditorTool) => {
    setEditorTool(tool);
    clearSelection();
    clearZoneSelection();
  };

  const toggleEditor = () => {
    toggleEditing();
    clearZoneSelection();
  };

  return (
    <section
      aria-label="Карта столов"
      className="min-w-0 flex-1 bg-slate-100"
    >
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">План зала</h2>

          <div className="flex items-center gap-2">
            <FloorMapEditorControls
              isEditing={isEditing}
              tool={editorTool}
              onToggle={toggleEditor}
              onCreateTable={() => void createTableOnActiveFloor()}
              onCreateZone={() => void createZoneOnActiveFloor()}
              onToolChange={selectEditorTool}
            />
            <div
              role="tablist"
              aria-label="Этажи ресторана"
              className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
            >
              {activeFloors.map((floor) => {
                const isSelected = floor.id === activeFloorId;

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
                    onClick={() => {
                      clearSelection();
                      clearZoneSelection();
                      void setActiveFloorId(floor.id);
                    }}
                  >
                    {floor.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${viewport.width || 1} ${viewport.height || 1}`}
            preserveAspectRatio="none"
            role="img"
            aria-labelledby="floor-map-title floor-map-description"
            className="size-full cursor-grab touch-none select-none active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPan}
            onPointerCancel={finishPan}
            onWheel={handleWheel}
          >
            <title id="floor-map-title">{`Карта столов: ${
              selectedFloor?.name ?? "этаж не выбран"
            }`}</title>
            <desc id="floor-map-description">
              {`На плане отображено столов: ${visibleTables.length}, зон: ${
                visibleZones.length
              }`}
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

            <rect width="100%" height="100%" className="fill-slate-50" />

            <g
              transform={`translate(${camera.offsetX} ${camera.offsetY}) scale(${camera.scale})`}
            >
              <rect width="1600" height="1000" className="fill-white" />
              <rect width="1600" height="1000" fill="url(#floor-map-grid)" />

              <g aria-label="Зоны">
                {visibleZones.map((zone) => (
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
                    onPointerDown={(event) =>
                      handleZonePointerDown(event, zone)
                    }
                    onPointerMove={handleZonePointerMove}
                    onPointerUp={finishZoneDrag}
                    onPointerCancel={cancelZoneDrag}
                  />
                ))}
              </g>

              <g aria-label="Столы">
                {visibleTables.map((table) => {
                  const tableWithPreview =
                    dragPreview?.tableId === table.id
                      ? {
                          ...table,
                          layout: {
                            ...table.layout,
                            x: dragPreview.x,
                            y: dragPreview.y,
                          },
                        }
                      : table;

                  return (
                  <TableNode
                    key={table.id}
                    table={{
                      ...tableWithPreview,
                      status: getDisplayedTableStatus(
                        tableWithPreview,
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
                        setFocusedReservationTableId(table.id);
                        return;
                      }

                      handleTablePointerDown(event, table);
                    }}
                    onPointerMove={handleTablePointerMove}
                    onPointerUp={finishTableDrag}
                    onPointerCancel={cancelTableDrag}
                  />
                  );
                })}
              </g>
            </g>
          </svg>

          {isTableEditing && selectedTable && (
            <FloorMapEditorPanel
              table={selectedTable}
              hasReservations={state.reservations.some(
                (reservation) => reservation.tableId === selectedTable.id,
              )}
              onSave={(details) => updateTable(selectedTable.id, details)}
              onDelete={async () => {
                const deleted = await deleteTable(selectedTable.id);

                if (deleted) clearSelection();

                return deleted;
              }}
            />
          )}

          {isZoneEditing && selectedZone && selectedZone.rect && (
            <FloorMapZoneEditorPanel
              zone={selectedZone}
              onSave={(details) => updateZone(selectedZone.id, details)}
              onDelete={async () => {
                const deleted = await deleteZone(selectedZone.id);

                if (deleted) clearZoneSelection();

                return deleted;
              }}
            />
          )}

          <FloorMapControls
            onZoomOut={() => zoomAtViewportCenter(1 / 1.2)}
            onFit={fitCamera}
            onZoomIn={() => zoomAtViewportCenter(1.2)}
          />
        </div>
      </div>
    </section>
  );
}
