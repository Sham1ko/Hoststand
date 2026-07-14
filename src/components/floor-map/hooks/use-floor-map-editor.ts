import {
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

import { resolveTableDrag } from "../model/interaction-transitions";

type TableDragState = {
  tableId: string;
  pointerId: number;
  layout: DiningTable["layout"];
  pointerOffset: Point;
  position: Point;
  hasMoved: boolean;
};

export type TableDragPreview = TablePosition & {
  tableId: string;
};

type UseFloorMapEditorOptions = {
  camera: Camera;
  onTablePositionChange: (
    tableId: string,
    position: TablePosition,
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

export function useFloorMapEditor({
  camera,
  onTablePositionChange,
}: UseFloorMapEditorOptions) {
  const tableDragRef = useRef<TableDragState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<TableDragPreview | null>(null);

  const startEditing = () => {
    setIsEditing(true);
    setSelectedTableId(null);
    setDragPreview(null);
    tableDragRef.current = null;
  };

  const stopEditing = () => {
    setIsEditing(false);
    setSelectedTableId(null);
    setDragPreview(null);
    tableDragRef.current = null;
  };

  const selectTable = (tableId: string) => {
    setSelectedTableId(tableId);
  };

  const clearSelection = () => {
    setSelectedTableId(null);
    setDragPreview(null);
    tableDragRef.current = null;
  };

  const handleTablePointerDown = (
    event: PointerEvent<SVGGElement>,
    table: DiningTable,
  ) => {
    if (!isEditing || !event.isPrimary || event.button !== 0) return;

    const pointer = getWorldPointerPosition(event, camera);

    if (!pointer) return;

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
    };
  };

  const handleTablePointerMove = (event: PointerEvent<SVGGElement>) => {
    const drag = tableDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const pointer = getWorldPointerPosition(event, camera);

    if (!pointer) return;

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

    drag.position = position;
    drag.hasMoved = true;
    setDragPreview({ tableId: drag.tableId, ...position });
  };

  const completeTableDrag = (
    event: PointerEvent<SVGGElement>,
    outcome: "commit" | "cancel",
  ) => {
    const drag = tableDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    if (outcome === "commit") event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    tableDragRef.current = null;
    setDragPreview(null);

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
