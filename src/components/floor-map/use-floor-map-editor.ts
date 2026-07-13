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
} from "@/features/floor-plan/model/geometry";
import type { DiningTable } from "@/features/floor-plan/model/types";
import type { TablePosition } from "@/features/restaurant-state/model/actions";

type TableDragState = {
  tableId: string;
  pointerId: number;
  layout: DiningTable["layout"];
  pointerOffset: Point;
  position: Point;
  hasMoved: boolean;
};

type DragPreview = TablePosition & {
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
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);

  const toggleEditing = () => {
    setIsEditing((currentValue) => !currentValue);
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

  const finishTableDrag = (event: PointerEvent<SVGGElement>) => {
    const drag = tableDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    tableDragRef.current = null;
    setDragPreview(null);

    if (!drag.hasMoved) return;

    onTablePositionChange(
      drag.tableId,
      getBoundedTablePosition(drag.position, drag.layout, true),
    );
  };

  const cancelTableDrag = (event: PointerEvent<SVGGElement>) => {
    const drag = tableDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    tableDragRef.current = null;
    setDragPreview(null);
  };

  return {
    isEditing,
    selectedTableId,
    dragPreview,
    toggleEditing,
    handleTablePointerDown,
    handleTablePointerMove,
    finishTableDrag,
    cancelTableDrag,
  };
}
