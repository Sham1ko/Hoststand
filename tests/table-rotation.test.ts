import {
  getPointerAngle,
  getTableRotationFromPointer,
  normalizeTableRotation,
  rotateTableBy,
} from "@/components/floor-map/model/table-rotation";

test("normalizes inspector rotation while preserving a full turn", () => {
  expect(normalizeTableRotation(0)).toBe(0);
  expect(normalizeTableRotation(360)).toBe(360);
  expect(normalizeTableRotation(450)).toBe(90);
  expect(normalizeTableRotation(-15)).toBe(345);
});

test("rotates by fixed steps across the zero-degree boundary", () => {
  expect(rotateTableBy(5, -15)).toBe(350);
  expect(rotateTableBy(350, 15)).toBe(5);
});

test("derives rotation from a circular pointer drag", () => {
  const center = { x: 100, y: 100 };
  const startPointerAngle = getPointerAngle(center, { x: 100, y: 50 });

  expect(
    getTableRotationFromPointer(
      30,
      startPointerAngle,
      center,
      { x: 150, y: 100 },
    ),
  ).toBe(120);
});
