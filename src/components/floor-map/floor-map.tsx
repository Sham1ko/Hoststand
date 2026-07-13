"use client";

import { useRestaurant } from "@/features/restaurant-state/ui/restaurant-provider";

import { FloorMapControls } from "./floor-map-controls";
import { FloorMapEditorControls } from "./floor-map-editor-controls";
import { TableNode } from "./table-node";
import { useFloorMapCamera } from "./use-floor-map-camera";
import { useFloorMapEditor } from "./use-floor-map-editor";

export function FloorMap() {
  const { state, setActiveFloorId, updateTablePosition } = useRestaurant();
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
  const activeFloors = floors.filter((floor) => floor.isActive);
  const selectedFloor = activeFloors.find(
    (floor) => floor.id === activeFloorId,
  );
  const visibleTables = tables.filter(
    (table) => table.floorId === activeFloorId,
  );

  return (
    <section
      aria-label="Карта столов"
      className="min-w-0 flex-1 bg-slate-100 p-5"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">План зала</h2>

          <div className="flex items-center gap-2">
            <FloorMapEditorControls
              isEditing={isEditing}
              onToggle={toggleEditing}
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
                    onClick={() => void setActiveFloorId(floor.id)}
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
              {`На плане отображено столов: ${visibleTables.length}`}
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

              <g aria-label="Столы">
                {visibleTables.map((table) => (
                  <TableNode
                    key={table.id}
                    table={
                      dragPreview?.tableId === table.id
                        ? {
                            ...table,
                            layout: {
                              ...table.layout,
                              x: dragPreview.x,
                              y: dragPreview.y,
                            },
                          }
                        : table
                    }
                    isEditing={isEditing}
                    isSelected={isEditing && table.id === selectedTableId}
                    onPointerDown={(event) =>
                      handleTablePointerDown(event, table)
                    }
                    onPointerMove={handleTablePointerMove}
                    onPointerUp={finishTableDrag}
                    onPointerCancel={cancelTableDrag}
                  />
                ))}
              </g>
            </g>
          </svg>

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
