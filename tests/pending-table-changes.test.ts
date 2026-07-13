import type { DiningTable } from "@/features/floor-plan/model/types";
import {
  applyTablePatch,
  mergeTablePatches,
} from "@/components/floor-map/use-pending-table-changes";

const table: DiningTable = {
  id: "table-1",
  number: 1,
  capacity: 4,
  floorId: "floor-1",
  status: "FREE",
  layout: {
    x: 100,
    y: 120,
    w: 150,
    h: 150,
    rotation: 0,
    shape: "square",
  },
};

test("combines table details and position into one patch", () => {
  const detailsPatch = {
    capacity: 6,
    layout: { shape: "round" as const },
  };
  const positionPatch = { layout: { x: 240, y: 280 } };

  expect(mergeTablePatches(detailsPatch, positionPatch)).toEqual({
    capacity: 6,
    layout: { shape: "round", x: 240, y: 280 },
  });
});

test("applies a pending patch without mutating the stored table", () => {
  const displayedTable = applyTablePatch(table, {
    status: "INACTIVE",
    layout: { shape: "round", x: 240 },
  });

  expect(displayedTable).toMatchObject({
    status: "INACTIVE",
    layout: { shape: "round", x: 240, y: 120, w: 150, h: 150 },
  });
  expect(table).toMatchObject({
    status: "FREE",
    layout: { shape: "square", x: 100 },
  });
});
