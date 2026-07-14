import type { Point } from "@/lib/floor-plan/geometry";

export type FloorMapRect = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

export type BoundingRectCache = {
  get: () => FloorMapRect | null;
  refresh: () => FloorMapRect | null;
  clear: () => void;
};

export function createBoundingRectCache(
  measure: () => FloorMapRect | null,
): BoundingRectCache {
  let rect: FloorMapRect | null = null;

  return {
    get() {
      return rect;
    },
    refresh() {
      const measuredRect = measure();

      rect = measuredRect
        ? {
            left: measuredRect.left,
            top: measuredRect.top,
            width: measuredRect.width,
            height: measuredRect.height,
          }
        : null;

      return rect;
    },
    clear() {
      rect = null;
    },
  };
}

export function getLocalPointerPosition(
  pointer: { clientX: number; clientY: number },
  rect: FloorMapRect,
): Point {
  return {
    x: pointer.clientX - rect.left,
    y: pointer.clientY - rect.top,
  };
}
