import type {
  DiningTable,
  TableFloor,
  TableZone,
} from "@/features/floor-plan/model/types";
import type { Reservation } from "@/features/reservations/model/types";

export interface RestaurantState {
  floors: TableFloor[];
  zones: TableZone[];
  tables: DiningTable[];
  reservations: Reservation[];
  activeFloorId: string;
}
