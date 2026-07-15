import type {
  DiningTable,
  TableShape,
  TableStatus,
} from "@/entities/table/model/types";
import type { TableFloor } from "@/entities/floor/model/types";

export const tableFloorSeed: readonly TableFloor[] = [
  { id: "floor-1", name: "1 этаж", sortOrder: 1, isActive: true },
  { id: "floor-2", name: "2 этаж", sortOrder: 2, isActive: true },
  { id: "summer", name: "Летник", sortOrder: 3, isActive: true },
];

function createTable(
  number: number,
  floorId: string,
  capacity: number,
  status: TableStatus,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: TableShape,
  rotation = 0,
): DiningTable {
  return {
    id: `table-${number}`,
    number,
    capacity,
    floorId,
    status,
    layout: { x, y, w, h, rotation, shape },
  };
}

export const diningTableSeed: readonly DiningTable[] = [
  createTable(1, "floor-1", 2, "FREE", 240, 280, 120, 120, "square"),
  createTable(2, "floor-1", 4, "FREE", 510, 280, 150, 150, "round"),
  createTable(3, "floor-1", 6, "FREE", 780, 280, 250, 130, "rect"),
  createTable(4, "floor-1", 4, "FREE", 240, 700, 150, 150, "square"),
  createTable(5, "floor-1", 4, "FREE", 510, 700, 150, 150, "round"),
  createTable(6, "floor-1", 8, "FREE", 780, 700, 310, 150, "rect"),
  createTable(7, "floor-1", 4, "FREE", 1110, 220, 150, 150, "square"),
  createTable(8, "floor-1", 6, "FREE", 1370, 220, 200, 120, "rect"),
  createTable(9, "floor-1", 4, "FREE", 1110, 500, 150, 150, "round"),
  createTable(10, "floor-1", 4, "FREE", 1370, 500, 150, 150, "square"),
  createTable(11, "floor-1", 6, "MANUAL_BLOCKED", 1110, 780, 200, 120, "rect"),
  createTable(12, "floor-1", 8, "FREE", 1370, 780, 260, 130, "rect"),

  createTable(13, "floor-2", 2, "FREE", 320, 300, 120, 120, "round"),
  createTable(15, "floor-2", 4, "FREE", 720, 300, 150, 150, "square"),
  createTable(17, "floor-2", 4, "FREE", 320, 700, 150, 150, "round"),
  createTable(18, "floor-2", 4, "INACTIVE", 720, 700, 150, 150, "square"),
  createTable(16, "floor-2", 6, "FREE", 1270, 300, 250, 130, "rect"),
  createTable(21, "floor-2", 6, "FREE", 1270, 700, 250, 130, "rect"),

  createTable(14, "summer", 2, "FREE", 300, 250, 120, 120, "square"),
  createTable(19, "summer", 4, "FREE", 800, 250, 150, 150, "round"),
  createTable(20, "summer", 6, "FREE", 1300, 250, 250, 130, "rect"),
  createTable(22, "summer", 4, "FREE", 300, 710, 150, 150, "round"),
  createTable(23, "summer", 6, "FREE", 800, 710, 250, 130, "rect"),
  createTable(24, "summer", 4, "INACTIVE", 1300, 710, 150, 150, "square"),
];
