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

export type ElementBoundingRectCache = BoundingRectCache & {
  setElement: (element: Element | null) => void;
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

export function createElementBoundingRectCache(): ElementBoundingRectCache {
  let element: Element | null = null;
  const cache = createBoundingRectCache(() => {
    const rect = element?.getBoundingClientRect();

    return rect
      ? {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }
      : null;
  });

  return {
    ...cache,
    setElement(nextElement) {
      element = nextElement;
      if (!element) cache.clear();
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
