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
  createTable(1, "floor-1", 2, "FREE", 210, 190, 120, 120, "square"),
  createTable(2, "floor-1", 4, "RESERVED", 500, 190, 150, 150, "round"),
  createTable(3, "floor-1", 6, "OCCUPIED", 850, 190, 250, 130, "rect"),
  createTable(4, "floor-1", 4, "FREE", 1260, 190, 150, 150, "square", 10),
  createTable(5, "floor-1", 4, "FREE", 260, 500, 150, 150, "round"),
  createTable(6, "floor-1", 8, "BANQUET", 680, 500, 310, 150, "rect", -8),
  createTable(7, "floor-1", 4, "FREE", 1120, 500, 150, 150, "square"),
  createTable(8, "floor-1", 6, "INACTIVE", 1390, 500, 250, 130, "rect"),
  createTable(9, "floor-1", 4, "RESERVED", 270, 810, 150, 150, "round"),
  createTable(10, "floor-1", 4, "FREE", 600, 810, 150, 150, "square"),
  createTable(11, "floor-1", 6, "MANUAL_BLOCKED", 950, 810, 250, 130, "rect", 7),
  createTable(12, "floor-1", 8, "RESERVED", 1330, 810, 310, 150, "rect"),

  createTable(13, "floor-2", 2, "FREE", 250, 230, 120, 120, "round"),
  createTable(15, "floor-2", 4, "FREE", 610, 230, 150, 150, "square"),
  createTable(16, "floor-2", 6, "OCCUPIED", 1060, 230, 250, 130, "rect", -6),
  createTable(17, "floor-2", 4, "FREE", 350, 650, 150, 150, "round"),
  createTable(18, "floor-2", 4, "INACTIVE", 780, 650, 150, 150, "square", 12),
  createTable(21, "floor-2", 6, "BANQUET", 1240, 650, 250, 130, "rect"),

  createTable(14, "summer", 2, "FREE", 230, 220, 120, 120, "square", 45),
  createTable(19, "summer", 4, "FREE", 650, 220, 150, 150, "round"),
  createTable(20, "summer", 6, "RESERVED", 1120, 220, 250, 130, "rect"),
  createTable(22, "summer", 4, "FREE", 350, 680, 150, 150, "round"),
  createTable(23, "summer", 6, "MANUAL_BLOCKED", 800, 680, 250, 130, "rect", 8),
  createTable(24, "summer", 4, "INACTIVE", 1270, 680, 150, 150, "square"),
];

