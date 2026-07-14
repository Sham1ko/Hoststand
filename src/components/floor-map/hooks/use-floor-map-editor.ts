import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import {
  getBoundedTablePosition,
  screenToWorld,
  type Camera,
  type Point,
} from "@/lib/floor-plan/geometry";
import type {
  DiningTable,
  TablePosition,
} from "@/entities/table/model/types";

import {
  getLocalPointerPosition,
  type BoundingRectCache,
  type FloorMapRect,
} from "../model/bounding-rect-cache";
import { resolveTableDrag } from "../model/interaction-transitions";
import { useRafCoalescer } from "./use-raf-coalescer";

type TableDragState = {
  tableId: string;
  pointerId: number;
  layout: DiningTable["layout"];
  pointerOffset: Point;
  position: Point;
  hasMoved: boolean;
  captureTarget: SVGGElement;
  svgRect: FloorMapRect;
};

export type TableDragPreview = TablePosition & {
  tableId: string;
};

type UseFloorMapEditorOptions = {
  camera: Camera;
  rectCache: BoundingRectCache;
  onTablePositionChange: (
    tableId: string,
    position: TablePosition,
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

function isSamePosition(first: Point, second: Point) {
  return first.x === second.x && first.y === second.y;
}

function isSameTablePreview(
  first: TableDragPreview | null,
  second: TableDragPreview,
) {
  return (
    first?.tableId === second.tableId &&
    first.x === second.x &&
    first.y === second.y
  );
}

function releaseTableCapture(drag: TableDragState) {
  if (drag.captureTarget.hasPointerCapture(drag.pointerId)) {
    drag.captureTarget.releasePointerCapture(drag.pointerId);
  }
}

export function useFloorMapEditor({
  camera,
  rectCache,
  onTablePositionChange,
}: UseFloorMapEditorOptions) {
  const tableDragRef = useRef<TableDragState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<TableDragPreview | null>(null);
  const dragPreviewRef = useRef(dragPreview);
  const previewUpdates = useRafCoalescer<TableDragPreview>((preview) => {
    const drag = tableDragRef.current;

    if (!drag || drag.tableId !== preview.tableId) return;
    if (isSameTablePreview(dragPreviewRef.current, preview)) return;

    dragPreviewRef.current = preview;
    setDragPreview(preview);
  });

  dragPreviewRef.current = dragPreview;

  const clearTableDrag = () => {
    previewUpdates.cancel();

    if (tableDragRef.current) {
      releaseTableCapture(tableDragRef.current);
      tableDragRef.current = null;
    }

    if (dragPreviewRef.current) {
      dragPreviewRef.current = null;
      setDragPreview(null);
    }
  };

  useEffect(
    () => () => {
      previewUpdates.cancel();

      if (tableDragRef.current) {
        releaseTableCapture(tableDragRef.current);
        tableDragRef.current = null;
      }
    },
    [previewUpdates],
  );

  const startEditing = () => {
    clearTableDrag();
    setIsEditing(true);
    setSelectedTableId(null);
  };

  const stopEditing = () => {
    clearTableDrag();
    setIsEditing(false);
    setSelectedTableId(null);
  };

  const selectTable = (tableId: string) => {
    setSelectedTableId(tableId);
  };

  const clearSelection = () => {
    clearTableDrag();
    setSelectedTableId(null);
  };

  const handleTablePointerDown = (
    event: PointerEvent<SVGGElement>,
    table: DiningTable,
  ) => {
    if (!isEditing || !event.isPrimary || event.button !== 0) return;

    const rect = rectCache.refresh();

    if (!rect) return;

    const pointer = getWorldPointerPosition(event, camera, rect);

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedTableId(table.id);
    tableDragRef.current = {
      tableId: table.id,
      pointerId: event.pointerId,
      layout: table.layout,
      pointerOffset: {
        x: pointer.x - table.layout.x,
        y: pointer.y - table.layout.y,
      },
      position: {
        x: table.layout.x,
        y: table.layout.y,
      },
      hasMoved: false,
      captureTarget: event.currentTarget,
      svgRect: rect,
    };
  };

  const handleTablePointerMove = (event: PointerEvent<SVGGElement>) => {
    const drag = tableDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const pointer = getWorldPointerPosition(event, camera, drag.svgRect);

    event.preventDefault();
    event.stopPropagation();

    const position = getBoundedTablePosition(
      {
        x: pointer.x - drag.pointerOffset.x,
        y: pointer.y - drag.pointerOffset.y,
      },
      drag.layout,
      false,
    );

    const previousPosition = drag.position;
    drag.position = position;
    drag.hasMoved = true;

    if (
      isSamePosition(previousPosition, position) &&
      !previewUpdates.hasPending()
    ) {
      return;
    }

    previewUpdates.schedule({ tableId: drag.tableId, ...position });
  };

  const completeTableDrag = (
    event: PointerEvent<SVGGElement>,
    outcome: "commit" | "cancel",
  ) => {
    const drag = tableDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    if (outcome === "commit") event.preventDefault();
    event.stopPropagation();

    if (outcome === "commit") {
      previewUpdates.flush();
    } else {
      previewUpdates.cancel();
    }

    releaseTableCapture(drag);
    tableDragRef.current = null;

    if (dragPreviewRef.current) {
      dragPreviewRef.current = null;
      setDragPreview(null);
    }

    const change = resolveTableDrag(drag, outcome);

    if (change) {
      onTablePositionChange(change.tableId, change.position);
    }
  };

  const finishTableDrag = (event: PointerEvent<SVGGElement>) =>
    completeTableDrag(event, "commit");

  const cancelTableDrag = (event: PointerEvent<SVGGElement>) =>
    completeTableDrag(event, "cancel");

  return {
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
  };
}
