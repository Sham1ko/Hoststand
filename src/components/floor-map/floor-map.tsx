"use client";

import { useState } from "react";

import { useRestaurant } from "@/features/restaurant-state/ui/restaurant-provider";
import { getReservedTableIds } from "@/features/reservations/model/selectors";

import { FloorMapCanvas } from "./floor-map-canvas";
import { FloorMapControls } from "./floor-map-controls";
import {
  FloorMapEditorControls,
  type FloorMapEditorTool,
} from "./floor-map-editor-controls";
import { FloorMapEditorPanel } from "./floor-map-editor-panel";
import { FloorMapZoneEditorPanel } from "./floor-map-zone-editor-panel";
import { useFloorMapCamera } from "./use-floor-map-camera";
import { useFloorMapCommands } from "./use-floor-map-commands";
import { useFloorMapEditor } from "./use-floor-map-editor";
import { useFloorMapZoneEditor } from "./use-floor-map-zone-editor";
import {
  applyTablePatch,
  usePendingTableChanges,
} from "./use-pending-table-changes";

export function FloorMap() {
  const {
    state,
    setActiveFloorId,
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
  const {
    patches: pendingTablePatches,
    isSaving: isSavingTableChanges,
    stagePatch: stageTablePatch,
    stagePosition: stageTablePosition,
    discardTable: discardPendingTableChanges,
    discardAll: discardAllTableChanges,
    saveChanges: saveTableChanges,
  } = usePendingTableChanges(updateTable);
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
    startEditing,
    stopEditing,
    selectTable,
    clearSelection,
    handleTablePointerDown,
    handleTablePointerMove,
    finishTableDrag,
    cancelTableDrag,
  } = useFloorMapEditor({
    camera,
    onTablePositionChange: stageTablePosition,
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
  const displayedTables = tables.map((table) =>
    applyTablePatch(table, pendingTablePatches[table.id]),
  );
  const visibleTables = displayedTables.filter(
    (table) => table.floorId === activeFloorId,
  );
  const reservedTableIds = getReservedTableIds(
    state.reservations,
    reservationDate,
  );
  const visibleZones = state.zones.filter(
    (zone) => zone.floorId === activeFloorId && zone.isActive && zone.rect,
  );
  const selectedTable = displayedTables.find(
    (table) => table.id === selectedTableId,
  );
  const selectedZone = state.zones.find((zone) => zone.id === selectedZoneId);
  const { createTableOnActiveFloor, createZoneOnActiveFloor } =
    useFloorMapCommands({
      activeFloorId,
      tables,
      visibleTableCount: visibleTables.length,
      visibleZones,
      createTable,
      createZone,
      selectTable,
      selectZone,
    });

  const selectEditorTool = (tool: FloorMapEditorTool) => {
    setEditorTool(tool);
    clearSelection();
    clearZoneSelection();
  };

  const saveAndExitEditor = async () => {
    if (!(await saveTableChanges())) return;

    stopEditing();
    clearZoneSelection();
  };

  const cancelEditor = () => {
    discardAllTableChanges();
    stopEditing();
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
              isSaving={isSavingTableChanges}
              tool={editorTool}
              onStart={startEditing}
              onSave={() => void saveAndExitEditor()}
              onCancel={cancelEditor}
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
          <FloorMapCanvas
            svgRef={svgRef}
            viewport={viewport}
            camera={camera}
            floorName={selectedFloor?.name}
            tables={visibleTables}
            zones={visibleZones}
            reservedTableIds={reservedTableIds}
            tableDragPreview={dragPreview}
            zoneDragPreview={zoneDragPreview}
            isEditing={isEditing}
            isTableEditing={isTableEditing}
            isZoneEditing={isZoneEditing}
            selectedTableId={selectedTableId}
            selectedZoneId={selectedZoneId}
            focusedReservationTableId={focusedReservationTableId}
            onTableFocus={setFocusedReservationTableId}
            onCanvasPointerDown={handlePointerDown}
            onCanvasPointerMove={handlePointerMove}
            onCanvasPointerEnd={finishPan}
            onWheel={handleWheel}
            onTablePointerDown={handleTablePointerDown}
            onTablePointerMove={handleTablePointerMove}
            onTablePointerUp={finishTableDrag}
            onTablePointerCancel={cancelTableDrag}
            onZonePointerDown={handleZonePointerDown}
            onZonePointerMove={handleZonePointerMove}
            onZonePointerUp={finishZoneDrag}
            onZonePointerCancel={cancelZoneDrag}
          />

          {isTableEditing && selectedTable && (
            <FloorMapEditorPanel
              key={selectedTable.id}
              table={selectedTable}
              hasReservations={state.reservations.some(
                (reservation) => reservation.tableId === selectedTable.id,
              )}
              onChange={(patch) => stageTablePatch(selectedTable.id, patch)}
              onDelete={async () => {
                const deleted = await deleteTable(selectedTable.id);

                if (deleted) {
                  discardPendingTableChanges(selectedTable.id);
                  clearSelection();
                }

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
