import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import {
  getBoundedZoneRect,
  screenToWorld,
  type Camera,
  type Point,
} from "@/lib/floor-plan/geometry";
import type { TableZone } from "@/entities/zone/model/types";

import {
  getLocalPointerPosition,
  type BoundingRectCache,
  type FloorMapRect,
} from "../model/bounding-rect-cache";
import { resolveZoneDrag } from "../model/interaction-transitions";
import { useRafCoalescer } from "./use-raf-coalescer";

type ZoneDragState = {
  zoneId: string;
  pointerId: number;
  kind: "move" | "resize";
  rect: NonNullable<TableZone["rect"]>;
  pointerOffset: Point;
  hasMoved: boolean;
  captureTarget: SVGGElement;
  svgRect: FloorMapRect;
};

export type ZoneDragPreview = NonNullable<TableZone["rect"]> & {
  zoneId: string;
};

type UseFloorMapZoneEditorOptions = {
  camera: Camera;
  rectCache: BoundingRectCache;
  isEditing: boolean;
  onZoneRectChange: (
    zoneId: string,
    rect: NonNullable<TableZone["rect"]>,
  ) => void;
};

function getWorldPointerPosition(
  event: PointerEvent<SVGGElement>,
  camera: Camera,
  rect: FloorMapRect,
) {
  return screenToWorld(
    getLocalPointerPosition(event, rect),
    camera,
  );
}

function isSameRect(
  first: NonNullable<TableZone["rect"]>,
  second: NonNullable<TableZone["rect"]>,
) {
  return (
    first.x === second.x &&
    first.y === second.y &&
    first.w === second.w &&
    first.h === second.h
  );
}

function isSameZonePreview(
  first: ZoneDragPreview | null,
  second: ZoneDragPreview,
) {
  return first?.zoneId === second.zoneId && isSameRect(first, second);
}

function releaseZoneCapture(drag: ZoneDragState) {
  if (drag.captureTarget.hasPointerCapture(drag.pointerId)) {
    drag.captureTarget.releasePointerCapture(drag.pointerId);
  }
}

export function useFloorMapZoneEditor({
  camera,
  rectCache,
  isEditing,
  onZoneRectChange,
}: UseFloorMapZoneEditorOptions) {
  const zoneDragRef = useRef<ZoneDragState | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<ZoneDragPreview | null>(null);
  const dragPreviewRef = useRef(dragPreview);
  const previewUpdates = useRafCoalescer<ZoneDragPreview>((preview) => {
    const drag = zoneDragRef.current;

    if (!drag || drag.zoneId !== preview.zoneId) return;
    if (isSameZonePreview(dragPreviewRef.current, preview)) return;

    dragPreviewRef.current = preview;
    setDragPreview(preview);
  });

  dragPreviewRef.current = dragPreview;

  const clearZoneDrag = () => {
    previewUpdates.cancel();

    if (zoneDragRef.current) {
      releaseZoneCapture(zoneDragRef.current);
      zoneDragRef.current = null;
    }

    if (dragPreviewRef.current) {
      dragPreviewRef.current = null;
      setDragPreview(null);
    }
  };

  useEffect(
    () => () => {
      previewUpdates.cancel();

      if (zoneDragRef.current) {
        releaseZoneCapture(zoneDragRef.current);
        zoneDragRef.current = null;
      }
    },
    [previewUpdates],
  );

  const selectZone = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId);
  }, []);

  const clearSelection = () => {
    clearZoneDrag();
    setSelectedZoneId(null);
  };

  const handleZonePointerDown = (
    event: PointerEvent<SVGGElement>,
    zone: TableZone,
  ) => {
    if (!isEditing || !zone.rect || !event.isPrimary || event.button !== 0) {
      return;
    }

    const rect = rectCache.refresh();

    if (!rect) return;

    const pointer = getWorldPointerPosition(event, camera, rect);

    const isResize = Boolean(
      (event.target as Element).closest("[data-zone-resize-handle]"),
    );

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedZoneId(zone.id);
    zoneDragRef.current = {
      zoneId: zone.id,
      pointerId: event.pointerId,
      kind: isResize ? "resize" : "move",
      rect: zone.rect,
      pointerOffset: {
        x: pointer.x - zone.rect.x,
        y: pointer.y - zone.rect.y,
      },
      hasMoved: false,
      captureTarget: event.currentTarget,
      svgRect: rect,
    };
  };

  const handleZonePointerMove = (event: PointerEvent<SVGGElement>) => {
    const drag = zoneDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const pointer = getWorldPointerPosition(event, camera, drag.svgRect);

    event.preventDefault();
    event.stopPropagation();

    const rect =
      drag.kind === "move"
        ? getBoundedZoneRect(
            {
              ...drag.rect,
              x: pointer.x - drag.pointerOffset.x,
              y: pointer.y - drag.pointerOffset.y,
            },
            false,
          )
        : getBoundedZoneRect(
            {
              ...drag.rect,
              w: pointer.x - drag.rect.x,
              h: pointer.y - drag.rect.y,
            },
            false,
          );

    const previousRect = drag.rect;
    drag.rect = rect;
    drag.hasMoved = true;

    if (isSameRect(previousRect, rect) && !previewUpdates.hasPending()) {
      return;
    }

    previewUpdates.schedule({ zoneId: drag.zoneId, ...rect });
  };

  const completeZoneDrag = (
    event: PointerEvent<SVGGElement>,
    outcome: "commit" | "cancel",
  ) => {
    const drag = zoneDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    if (outcome === "commit") event.preventDefault();
    event.stopPropagation();

    if (outcome === "commit") {
      previewUpdates.flush();
    } else {
      previewUpdates.cancel();
    }

    releaseZoneCapture(drag);
    zoneDragRef.current = null;

    if (dragPreviewRef.current) {
      dragPreviewRef.current = null;
      setDragPreview(null);
    }

    const change = resolveZoneDrag(drag, outcome);

    if (change) {
      onZoneRectChange(change.zoneId, change.rect);
    }
  };

  const finishZoneDrag = (event: PointerEvent<SVGGElement>) =>
    completeZoneDrag(event, "commit");

  const cancelZoneDrag = (event: PointerEvent<SVGGElement>) =>
    completeZoneDrag(event, "cancel");

  return {
    selectedZoneId,
    dragPreview,
    selectZone,
    clearSelection,
    handleZonePointerDown,
    handleZonePointerMove,
    finishZoneDrag,
    cancelZoneDrag,
  };
}
