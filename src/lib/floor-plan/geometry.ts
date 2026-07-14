export const FLOOR_PLAN_SIZE = {
  width: 1600,
  height: 1000,
} as const;

export const FLOOR_PLAN_GRID_SIZE = 20;
export const MIN_ZONE_SIZE = 120;
export const MIN_CAMERA_SCALE = 0.25;
export const MAX_CAMERA_SCALE = 2.5;

export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Camera = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type TableLayoutBounds = {
  w: number;
  h: number;
  rotation: number;
};

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampCameraScale(scale: number) {
  return clamp(scale, MIN_CAMERA_SCALE, MAX_CAMERA_SCALE);
}

export function screenToWorld(point: Point, camera: Camera): Point {
  return {
    x: (point.x - camera.offsetX) / camera.scale,
    y: (point.y - camera.offsetY) / camera.scale,
  };
}

export function getPannedCamera(
  camera: Camera,
  pointerAtStart: Point,
  pointer: Point,
): Camera {
  return {
    ...camera,
    offsetX: camera.offsetX + pointer.x - pointerAtStart.x,
    offsetY: camera.offsetY + pointer.y - pointerAtStart.y,
  };
}

export function zoomCameraAtPoint(
  camera: Camera,
  cursor: Point,
  nextScale: number,
): Camera {
  const scale = clampCameraScale(nextScale);
  const worldPoint = screenToWorld(cursor, camera);

  return {
    scale,
    offsetX: cursor.x - worldPoint.x * scale,
    offsetY: cursor.y - worldPoint.y * scale,
  };
}

export function fitCameraToViewport(viewport: Size, padding = 40): Camera {
  const availableWidth = Math.max(0, viewport.width - padding * 2);
  const availableHeight = Math.max(0, viewport.height - padding * 2);
  const scale = clampCameraScale(
    Math.min(
      availableWidth / FLOOR_PLAN_SIZE.width,
      availableHeight / FLOOR_PLAN_SIZE.height,
    ),
  );

  return {
    scale,
    offsetX: (viewport.width - FLOOR_PLAN_SIZE.width * scale) / 2,
    offsetY: (viewport.height - FLOOR_PLAN_SIZE.height * scale) / 2,
  };
}

export function snapToGrid(value: number, gridSize = FLOOR_PLAN_GRID_SIZE) {
  return Math.round(value / gridSize) * gridSize;
}

export function snapPointToGrid(
  point: Point,
  gridSize = FLOOR_PLAN_GRID_SIZE,
): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}

export function getRotatedTableHalfExtents({
  w,
  h,
  rotation,
}: TableLayoutBounds): Point {
  const radians = (rotation * Math.PI) / 180;
  const cosine = Math.abs(normalizeTrigonometricValue(Math.cos(radians)));
  const sine = Math.abs(normalizeTrigonometricValue(Math.sin(radians)));

  return {
    x: (w / 2) * cosine + (h / 2) * sine,
    y: (w / 2) * sine + (h / 2) * cosine,
  };
}

function normalizeTrigonometricValue(value: number) {
  return Math.abs(value) < Number.EPSILON * 16 ? 0 : value;
}

export function clampTablePosition(
  position: Point,
  layout: TableLayoutBounds,
): Point {
  const halfExtents = getRotatedTableHalfExtents(layout);

  return {
    x: clamp(
      position.x,
      halfExtents.x,
      FLOOR_PLAN_SIZE.width - halfExtents.x,
    ),
    y: clamp(
      position.y,
      halfExtents.y,
      FLOOR_PLAN_SIZE.height - halfExtents.y,
    ),
  };
}

export function getBoundedTablePosition(
  position: Point,
  layout: TableLayoutBounds,
  shouldSnap: boolean,
): Point {
  const nextPosition = shouldSnap ? snapPointToGrid(position) : position;

  return clampTablePosition(nextPosition, layout);
}

export function getBoundedZoneRect(rect: Rect, shouldSnap: boolean): Rect {
  const nextRect = shouldSnap
    ? {
        x: snapToGrid(rect.x),
        y: snapToGrid(rect.y),
        w: snapToGrid(rect.w),
        h: snapToGrid(rect.h),
      }
    : rect;
  const w = clamp(nextRect.w, MIN_ZONE_SIZE, FLOOR_PLAN_SIZE.width);
  const h = clamp(nextRect.h, MIN_ZONE_SIZE, FLOOR_PLAN_SIZE.height);

  return {
    x: clamp(nextRect.x, 0, FLOOR_PLAN_SIZE.width - w),
    y: clamp(nextRect.y, 0, FLOOR_PLAN_SIZE.height - h),
    w,
    h,
  };
}
