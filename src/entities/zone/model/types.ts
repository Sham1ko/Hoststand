export interface TableZone {
  id: string;
  floorId: string;
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
  rect?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export type ZoneDetails = Pick<TableZone, "name" | "color"> & {
  rect: NonNullable<TableZone["rect"]>;
};
