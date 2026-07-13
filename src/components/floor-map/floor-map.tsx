"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";

import { Button } from "@/components/ui/button";
import {
  fitCameraToViewport,
  zoomCameraAtPoint,
  type Camera,
  type Point,
  type Size,
} from "@/features/floor-plan/model/geometry";
import { useRestaurant } from "@/features/restaurant-state/ui/restaurant-provider";

import { FloorMapControls } from "./floor-map-controls";
import { TableNode } from "./table-node";

const initialCamera: Camera = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

type PanState = {
  pointerId: number;
  pointer: Point;
  camera: Camera;
};

export function FloorMap() {
  const { state, setActiveFloorId } = useRestaurant();
  const { floors, tables, activeFloorId } = state;
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<PanState | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [camera, setCamera] = useState(initialCamera);
  const activeFloors = floors.filter((floor) => floor.isActive);
  const selectedFloor = activeFloors.find(
    (floor) => floor.id === activeFloorId,
  );
  const visibleTables = tables.filter(
    (table) => table.floorId === activeFloorId,
  );

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextViewport = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      setViewport((currentViewport) =>
        currentViewport.width === nextViewport.width &&
        currentViewport.height === nextViewport.height
          ? currentViewport
          : nextViewport,
      );
    });

    resizeObserver.observe(svg);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;

    setCamera(fitCameraToViewport(viewport));
  }, [viewport]);

  const getPointerPosition = (event: {
    clientX: number;
    clientY: number;
  }) => {
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect) return null;

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const fitCamera = () => {
    if (!viewport.width || !viewport.height) return;

    setCamera(fitCameraToViewport(viewport));
  };

  const zoomAtViewportCenter = (factor: number) => {
    if (!viewport.width || !viewport.height) return;

    const cursor = {
      x: viewport.width / 2,
      y: viewport.height / 2,
    };

    setCamera((currentCamera) =>
      zoomCameraAtPoint(currentCamera, cursor, currentCamera.scale * factor),
    );
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    const cursor = getPointerPosition(event);

    if (!cursor) return;

    event.preventDefault();

    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

    setCamera((currentCamera) =>
      zoomCameraAtPoint(currentCamera, cursor, currentCamera.scale * factor),
    );
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    if ((event.target as Element).closest("[data-table-node]")) return;

    const pointer = getPointerPosition(event);

    if (!pointer) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      pointer,
      camera,
    };
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current;

    if (!pan || pan.pointerId !== event.pointerId) return;

    const pointer = getPointerPosition(event);

    if (!pointer) return;

    setCamera({
      ...pan.camera,
      offsetX: pan.camera.offsetX + pointer.x - pan.pointer.x,
      offsetY: pan.camera.offsetY + pointer.y - pan.pointer.y,
    });
  };

  const finishPan = (event: PointerEvent<SVGSVGElement>) => {
    if (panRef.current?.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    panRef.current = null;
  };

  return (
    <section
      aria-label="Карта столов"
      className="min-w-0 flex-1 bg-slate-100 p-5"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">План зала</h2>

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
                  <TableNode key={table.id} table={table} />
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
