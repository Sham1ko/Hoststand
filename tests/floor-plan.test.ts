import {
  diningTableSeed,
  tableFloorSeed,
} from "@/features/floor-plan/data/seed";

test("provides three floors and 24 uniquely numbered tables", () => {
  expect(tableFloorSeed).toHaveLength(3);
  expect(diningTableSeed).toHaveLength(24);
  expect(new Set(diningTableSeed.map((table) => table.id)).size).toBe(24);
  expect(new Set(diningTableSeed.map((table) => table.number)).size).toBe(24);
});

test("assigns every table to an existing floor inside the world canvas", () => {
  const floorIds = new Set(tableFloorSeed.map((floor) => floor.id));

  for (const table of diningTableSeed) {
    expect(floorIds.has(table.floorId)).toBe(true);
    expect(table.layout.x).toBeGreaterThanOrEqual(0);
    expect(table.layout.x).toBeLessThanOrEqual(1600);
    expect(table.layout.y).toBeGreaterThanOrEqual(0);
    expect(table.layout.y).toBeLessThanOrEqual(1000);
  }
});
