import type { TableFloor } from "@/entities/floor/model/types";
import type { Reservation } from "@/entities/reservation/model/types";
import type { DiningTable } from "@/entities/table/model/types";
import type { TableZone } from "@/entities/zone/model/types";

export interface RestaurantState {
  floors: TableFloor[];
  zones: TableZone[];
  tables: DiningTable[];
  reservations: Reservation[];
  activeFloorId: string;
}
