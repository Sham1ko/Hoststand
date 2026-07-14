"use client";

import { useState } from "react";

import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";
import { getReservedTableIds } from "@/features/reservation-management/model/selectors";

import { useFloorMapCamera } from "./hooks/use-floor-map-camera";
import { useFloorMapCommands } from "./hooks/use-floor-map-commands";
import { useFloorMapEditor } from "./hooks/use-floor-map-editor";
import { useFloorMapZoneEditor } from "./hooks/use-floor-map-zone-editor";
import {
  getDraftTables,
  usePendingTableChanges,
} from "./model/pending-table-changes";
import { FloorMapCanvas } from "./ui/floor-map-canvas";
import { FloorMapControls } from "./ui/floor-map-controls";
import {
  FloorMapEditorControls,
  type FloorMapEditorTool,
} from "./ui/floor-map-editor-controls";
import { FloorMapEditorPanel } from "./ui/floor-map-editor-panel";
import { FloorMapZoneEditorPanel } from "./ui/floor-map-zone-editor-panel";
import { FloorSwitcher } from "./ui/floor-switcher";

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
    createdTables,
    deletedTableIds,
    isSaving: isSavingTableChanges,
    stagePatch: stageTablePatch,
    stagePosition: stageTablePosition,
    stageCreation: stageTableCreation,
    stageDeletion: stageTableDeletion,
    discardAll: discardAllTableChanges,
    saveChanges: saveTableChanges,
  } = usePendingTableChanges(updateTable, deleteTable, createTable);
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
  const displayedTables = getDraftTables(
    tables,
    Object.values(createdTables),
    pendingTablePatches,
    deletedTableIds,
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
      tables: displayedTables,
      visibleTableCount: visibleTables.length,
      visibleZones,
      createTable: stageTableCreation,
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

          <FloorSwitcher
            floors={activeFloors}
            tables={displayedTables}
            activeFloorId={activeFloorId}
            onFloorChange={(floorId) => {
              clearSelection();
              clearZoneSelection();
              void setActiveFloorId(floorId);
            }}
          />

          {isTableEditing && selectedTable && (
            <FloorMapEditorPanel
              key={selectedTable.id}
              table={selectedTable}
              hasReservations={state.reservations.some(
                (reservation) => reservation.tableId === selectedTable.id,
              )}
              onChange={(patch) => stageTablePatch(selectedTable.id, patch)}
              onDelete={() => {
                stageTableDeletion(selectedTable.id);
                clearSelection();
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
