"use client";

import { useCallback, useMemo, useState } from "react";

import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";
import { rebindTablesToZones } from "@/entities/restaurant/model/zone-binding";
import type { ZonePatchInput } from "@/entities/zone/model/schemas";
import {
  getLocalDayTimestamp,
  getReservedTableIds,
} from "@/features/reservation-management/model/selectors";

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
  const { floors, tables, zones, reservations, activeFloorId } = state;
  const saveZonePatch = useCallback(
    async (zoneId: string, patch: ZonePatchInput) => {
      const zone = zones.find((item) => item.id === zoneId);
      const rect = patch.rect ?? zone?.rect;

      if (!zone || !rect) return false;

      return updateZone(zoneId, {
        name: patch.name ?? zone.name,
        color: patch.color ?? zone.color,
        rect,
      });
    },
    [updateZone, zones],
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
  const activeFloors = useMemo(
    () => floors.filter((floor) => floor.isActive),
    [floors],
  );
  const selectedFloor = useMemo(
    () => activeFloors.find((floor) => floor.id === activeFloorId),
    [activeFloorId, activeFloors],
  );
  const createdZoneValues = useMemo(
    () => Object.values(createdZones),
    [createdZones],
  );
  const createdTableValues = useMemo(
    () => Object.values(createdTables),
    [createdTables],
  );
  const displayedZones = useMemo(
    () =>
      getDraftZones(
        zones,
        createdZoneValues,
        pendingZonePatches,
        deletedZoneIds,
      ),
    [createdZoneValues, deletedZoneIds, pendingZonePatches, zones],
  );
  const draftTables = useMemo(
    () =>
      getDraftTables(
        tables,
        createdTableValues,
        pendingTablePatches,
        deletedTableIds,
      ),
    [createdTableValues, deletedTableIds, pendingTablePatches, tables],
  );
  // In the editor the zone dots must follow the draft zones, so bindings are
  // recomputed against the draft before anything is saved.
  const displayedTables = useMemo(
    () =>
      isEditing
        ? rebindTablesToZones(displayedZones, draftTables)
        : draftTables,
    [displayedZones, draftTables, isEditing],
  );
  const visibleTables = useMemo(
    () =>
      displayedTables.filter((table) => table.floorId === activeFloorId),
    [activeFloorId, displayedTables],
  );
  const visibleZones = useMemo(
    () =>
      displayedZones.filter(
        (zone) =>
          zone.floorId === activeFloorId && zone.isActive && zone.rect,
      ),
    [activeFloorId, displayedZones],
  );
  const selectedTable = useMemo(
    () => displayedTables.find((table) => table.id === selectedTableId),
    [displayedTables, selectedTableId],
  );
  const selectedZone = useMemo(
    () => displayedZones.find((zone) => zone.id === selectedZoneId),
    [displayedZones, selectedZoneId],
  );
  const reservationDayTimestamp = getLocalDayTimestamp(reservationDate);
  const reservedTableIds = useMemo(
    () =>
      getReservedTableIds(
        reservations,
        new Date(reservationDayTimestamp),
      ),
    [reservationDayTimestamp, reservations],
  );
  const selectedTableHasReservations = useMemo(
    () =>
      selectedTable
        ? reservations.some(
            (reservation) => reservation.tableId === selectedTable.id,
          )
        : false,
    [reservations, selectedTable],
  );
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
              hasReservations={selectedTableHasReservations}
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
