import {
  useRef,
  useState,
  type PointerEvent,
} from "react";

import {
  getBoundedZoneRect,
  screenToWorld,
  type Camera,
  type Point,
} from "@/features/floor-plan/model/geometry";
import type { TableZone } from "@/features/floor-plan/model/types";

type ZoneDragState = {
  zoneId: string;
  pointerId: number;
  kind: "move" | "resize";
  rect: NonNullable<TableZone["rect"]>;
  pointerOffset: Point;
  hasMoved: boolean;
};

type ZonePreview = NonNullable<TableZone["rect"]> & {
  zoneId: string;
};

type UseFloorMapZoneEditorOptions = {
  camera: Camera;
  isEditing: boolean;
  onZoneRectChange: (
    zoneId: string,
    rect: NonNullable<TableZone["rect"]>,
  ) => void;
};

function getWorldPointerPosition(
  event: PointerEvent<SVGGElement>,
  camera: Camera,
) {
  const svg = event.currentTarget.ownerSVGElement;

  if (!svg) return null;

  const rect = svg.getBoundingClientRect();

  return screenToWorld(
    {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    },
    camera,
  );
}

export function useFloorMapZoneEditor({
  camera,
  isEditing,
  onZoneRectChange,
}: UseFloorMapZoneEditorOptions) {
  const zoneDragRef = useRef<ZoneDragState | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<ZonePreview | null>(null);

  const selectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
  };

  const clearSelection = () => {
    setSelectedZoneId(null);
    setDragPreview(null);
    zoneDragRef.current = null;
  };

  const handleZonePointerDown = (
    event: PointerEvent<SVGGElement>,
    zone: TableZone,
  ) => {
    if (!isEditing || !zone.rect || !event.isPrimary || event.button !== 0) {
      return;
    }

    const pointer = getWorldPointerPosition(event, camera);

    if (!pointer) return;

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
    };
  };

  const handleZonePointerMove = (event: PointerEvent<SVGGElement>) => {
    const drag = zoneDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const pointer = getWorldPointerPosition(event, camera);

    if (!pointer) return;

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

    drag.rect = rect;
    drag.hasMoved = true;
    setDragPreview({ zoneId: drag.zoneId, ...rect });
  };

  const finishZoneDrag = (event: PointerEvent<SVGGElement>) => {
    const drag = zoneDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    zoneDragRef.current = null;
    setDragPreview(null);

    if (!drag.hasMoved) return;

    onZoneRectChange(drag.zoneId, getBoundedZoneRect(drag.rect, true));
  };

  const cancelZoneDrag = (event: PointerEvent<SVGGElement>) => {
    const drag = zoneDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    zoneDragRef.current = null;
    setDragPreview(null);
  };

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
