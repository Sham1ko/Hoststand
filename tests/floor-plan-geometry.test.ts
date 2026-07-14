import {
  FLOOR_PLAN_SIZE,
  clampTablePosition,
  fitCameraToViewport,
  getBoundedTablePosition,
  getBoundedZoneRect,
  getRotatedTableHalfExtents,
  screenToWorld,
  zoomCameraAtPoint,
} from "@/lib/floor-plan/geometry";

test("converts screen coordinates to world coordinates", () => {
  const camera = { scale: 0.75, offsetX: 120, offsetY: 80 };

  expect(screenToWorld({ x: 600, y: 380 }, camera)).toEqual({
    x: 640,
    y: 400,
  });
});

test("keeps the world point under the cursor while zooming", () => {
  const camera = { scale: 0.5, offsetX: 20, offsetY: 50 };
  const cursor = { x: 200, y: 140 };
  const worldPoint = screenToWorld(cursor, camera);
  const zoomedCamera = zoomCameraAtPoint(camera, cursor, 1);

  expect(screenToWorld(cursor, zoomedCamera)).toEqual(worldPoint);
});

test("fits the world canvas within the viewport with padding", () => {
  expect(fitCameraToViewport({ width: 800, height: 600 })).toEqual({
    scale: 0.45,
    offsetX: 40,
    offsetY: 75,
  });
});

test("calculates rotated table bounds before clamping the position", () => {
  const layout = { w: 200, h: 100, rotation: 90 };

  expect(getRotatedTableHalfExtents(layout)).toEqual({ x: 50, y: 100 });
  expect(clampTablePosition({ x: -1, y: 1200 }, layout)).toEqual({
    x: 50,
    y: FLOOR_PLAN_SIZE.height - 100,
  });
});

test("snaps table positions before keeping them inside the world bounds", () => {
  const layout = { w: 100, h: 100, rotation: 0 };

  expect(
    getBoundedTablePosition({ x: 31, y: 49 }, layout, true),
  ).toEqual({ x: 50, y: 50 });
  expect(
    getBoundedTablePosition({ x: 2000, y: -20 }, layout, true),
  ).toEqual({ x: 1550, y: 50 });
});

test("keeps zones on the grid and within the floor plan", () => {
  expect(
    getBoundedZoneRect({ x: -20, y: 940, w: 80, h: 100 }, true),
  ).toEqual({ x: 0, y: 880, w: 120, h: 120 });
});
