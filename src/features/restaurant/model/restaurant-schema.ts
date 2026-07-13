import * as z from "zod";

import {
  diningTableSchema,
  tableFloorSchema,
  tableZoneSchema,
} from "@/features/floor-plan/model/schemas";
import { reservationSchema } from "@/features/reservations/model/schemas";

export const restaurantStateSchema = z
  .object({
    floors: z.array(tableFloorSchema),
    zones: z.array(tableZoneSchema),
    tables: z.array(diningTableSchema),
    reservations: z.array(reservationSchema),
    activeFloorId: z.string().min(1),
  })
  .strict();
