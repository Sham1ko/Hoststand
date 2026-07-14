import type { DiningTable } from "@/entities/table/model/types";
import {
  applyTablePatch,
  createDraftTable,
  getDraftTables,
  mergeTablePatches,
} from "@/components/floor-map/model/pending-table-changes";

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

test("hides a table staged for deletion without changing stored tables", () => {
  const displayedTables = getDraftTables(
    [table],
    [],
    {},
    new Set([table.id]),
  );

  expect(displayedTables).toEqual([]);
  expect(table.id).toBe("table-1");
});

test("adds a new table to the draft without changing stored tables", () => {
  const createdTable = createDraftTable(
    {
      number: 2,
      capacity: 6,
      floorId: "floor-1",
      status: "FREE",
      layout: {
        x: 240,
        y: 280,
        w: 180,
        h: 120,
        rotation: 0,
        shape: "rect",
      },
    },
    "draft-table-2",
  );

  const displayedTables = getDraftTables(
    [table],
    [createdTable],
    { "draft-table-2": { layout: { shape: "round" } } },
    new Set(),
  );

  expect(displayedTables).toHaveLength(2);
  expect(displayedTables[1]).toMatchObject({
    id: "draft-table-2",
    number: 2,
    layout: { shape: "round", x: 240, y: 280 },
  });
  expect(table.number).toBe(1);
});
