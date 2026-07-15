import {
  resolveTableDrag,
  resolveTableRotation,
  resolveZoneDrag,
} from "@/components/floor-map/model/interaction-transitions";

const tableLayout = {
  x: 100,
  y: 120,
  w: 150,
  h: 150,
  rotation: 0,
  shape: "square" as const,
};

test("commits a moved table with final snap and clamp", () => {
  expect(
    resolveTableDrag(
      {
        tableId: "table-1",
        layout: tableLayout,
        position: { x: 231, y: 269 },
        hasMoved: true,
      },
      "commit",
    ),
  ).toEqual({ tableId: "table-1", position: { x: 240, y: 260 } });
});

test("does not commit a table click without movement", () => {
  expect(
    resolveTableDrag(
      {
        tableId: "table-1",
        layout: tableLayout,
        position: { x: 100, y: 120 },
        hasMoved: false,
      },
      "commit",
    ),
  ).toBeNull();
});

test("does not commit a moved table after pointercancel", () => {
  expect(
    resolveTableDrag(
      {
        tableId: "table-1",
        layout: tableLayout,
        position: { x: 231, y: 269 },
        hasMoved: true,
      },
      "cancel",
    ),
  ).toBeNull();
});

test("commits rotation only after a completed drag", () => {
  const rotation = {
    tableId: "table-1",
    rotation: 135,
    hasMoved: true,
  };

  expect(resolveTableRotation(rotation, "commit")).toEqual({
    tableId: "table-1",
    rotation: 135,
  });
  expect(resolveTableRotation(rotation, "cancel")).toBeNull();
  expect(
    resolveTableRotation({ ...rotation, hasMoved: false }, "commit"),
  ).toBeNull();
});

test("commits a moved or resized zone with final snap and clamp", () => {
  expect(
    resolveZoneDrag(
      {
        zoneId: "zone-1",
        rect: { x: 91, y: 109, w: 173, h: 247 },
        hasMoved: true,
      },
      "commit",
    ),
  ).toEqual({
    zoneId: "zone-1",
    rect: { x: 100, y: 100, w: 180, h: 240 },
  });
});

test("does not commit a zone click or pointercancel", () => {
  const drag = {
    zoneId: "zone-1",
    rect: { x: 91, y: 109, w: 173, h: 247 },
    hasMoved: false,
  };

  expect(resolveZoneDrag(drag, "commit")).toBeNull();
  expect(
    resolveZoneDrag({ ...drag, hasMoved: true }, "cancel"),
  ).toBeNull();
});
