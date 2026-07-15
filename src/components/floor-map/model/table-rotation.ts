import type { Point } from "@/lib/floor-plan/geometry";

export function normalizeTableRotation(rotation: number) {
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  return normalizedRotation === 0 && rotation > 0 ? 360 : normalizedRotation;
}

export function rotateTableBy(rotation: number, delta: number) {
  return ((rotation + delta) % 360 + 360) % 360;
}

export function getPointerAngle(center: Point, pointer: Point) {
  return (Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) /
    Math.PI;
}

export function getTableRotationFromPointer(
  startRotation: number,
  startPointerAngle: number,
  center: Point,
  pointer: Point,
) {
  const pointerAngle = getPointerAngle(center, pointer);

  return Math.round(rotateTableBy(startRotation, pointerAngle - startPointerAngle));
}
