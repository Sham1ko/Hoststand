"use client";

import { useCallback, useState } from "react";

import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";
import { rebindTablesToZones } from "@/entities/restaurant/model/zone-binding";
import type { ZonePatchInput } from "@/entities/zone/model/schemas";
import { getReservedTableIds } from "@/features/reservation-management/model/selectors";

import { useFloorMapCamera } from "./hooks/use-floor-map-camera";
import { useFloorMapCommands } from "./hooks/use-floor-map-commands";
import { useFloorMapEditor } from "./hooks/use-floor-map-editor";
import { useFloorMapZoneEditor } from "./hooks/use-floor-map-zone-editor";
import {
  getDraftTables,
  usePendingTableChanges,
} from "./model/pending-table-changes";
import {
  getDraftZones,
  usePendingZoneChanges,
} from "./model/pending-zone-changes";
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
  const saveZonePatch = useCallback(
    async (zoneId: string, patch: ZonePatchInput) => {
      const zone = state.zones.find((item) => item.id === zoneId);
      const rect = patch.rect ?? zone?.rect;

      if (!zone || !rect) return false;

      return updateZone(zoneId, {
        name: patch.name ?? zone.name,
        color: patch.color ?? zone.color,
        rect,
      });
    },
    [state.zones, updateZone],
  );
  const {
    patches: pendingZonePatches,
    createdZones,
    deletedZoneIds,
    isSaving: isSavingZoneChanges,
    stagePatch: stageZonePatch,
    stageRect: stageZoneRect,
    stageCreation: stageZoneCreation,
    stageDeletion: stageZoneDeletion,
    discardAll: discardAllZoneChanges,
    saveChanges: saveZoneChanges,
  } = usePendingZoneChanges(saveZonePatch, deleteZone, createZone);
  const {
    svgRef,
    rectCache,
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
    rectCache,
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
    rectCache,
    isEditing: isZoneEditing,
    onZoneRectChange: stageZoneRect,
  });
  const activeFloors = floors.filter((floor) => floor.isActive);
  const selectedFloor = activeFloors.find(
    (floor) => floor.id === activeFloorId,
  );
  const displayedZones = getDraftZones(
    state.zones,
    Object.values(createdZones),
    pendingZonePatches,
    deletedZoneIds,
  );
  const draftTables = getDraftTables(
    tables,
    Object.values(createdTables),
    pendingTablePatches,
    deletedTableIds,
  );
  // In the editor the zone dots must follow the draft zones, so bindings are
  // recomputed against the draft before anything is saved.
  const displayedTables = isEditing
    ? rebindTablesToZones(displayedZones, draftTables)
    : draftTables;
  const visibleTables = displayedTables.filter(
    (table) => table.floorId === activeFloorId,
  );
  const reservedTableIds = getReservedTableIds(
    state.reservations,
    reservationDate,
  );
  const visibleZones = displayedZones.filter(
    (zone) => zone.floorId === activeFloorId && zone.isActive && zone.rect,
  );
  const selectedTable = displayedTables.find(
    (table) => table.id === selectedTableId,
  );
  const selectedZone = displayedZones.find((zone) => zone.id === selectedZoneId);
  const { createTableOnActiveFloor, createZoneOnActiveFloor } =
    useFloorMapCommands({
      activeFloorId,
      tables: displayedTables,
      visibleTableCount: visibleTables.length,
      visibleZones,
      createTable: stageTableCreation,
      createZone: stageZoneCreation,
      selectTable,
      selectZone,
    });

  const selectEditorTool = (tool: FloorMapEditorTool) => {
    setEditorTool(tool);
    clearSelection();
    clearZoneSelection();
  };

  const saveAndExitEditor = async () => {
    // Zones are committed first so that saved tables bind to the final zones.
    if (!(await saveZoneChanges())) return;
    if (!(await saveTableChanges())) return;

    stopEditing();
    clearZoneSelection();
  };

  const cancelEditor = () => {
    discardAllTableChanges();
    discardAllZoneChanges();
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
            isSaving={isSavingTableChanges || isSavingZoneChanges}
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
              onSave={async (details) => {
                stageZonePatch(selectedZone.id, details);
                return true;
              }}
              onDelete={async () => {
                stageZoneDeletion(selectedZone.id);
                clearZoneSelection();
                return true;
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
