export type TableStatus =
  | "FREE"
  | "OCCUPIED"
  | "RESERVED"
  | "BANQUET"
  | "MANUAL_BLOCKED"
  | "INACTIVE";

export type TableShape = "round" | "square" | "rect";

export interface DiningTable {
  id: string;
  number: number;
  capacity: number;
  floorId: string;
  zoneId?: string;
  status: TableStatus;
  layout: {
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    shape: TableShape;
  };
}

export interface TableFloor {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
