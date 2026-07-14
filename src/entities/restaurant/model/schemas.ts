import * as z from "zod";

import { tableFloorSchema } from "@/entities/floor/model/schemas";
import { reservationSchema } from "@/entities/reservation/model/schemas";
import { diningTableSchema } from "@/entities/table/model/schemas";
import { tableZoneSchema } from "@/entities/zone/model/schemas";

export const restaurantStateSchema = z
  .object({
    floors: z.array(tableFloorSchema),
    zones: z.array(tableZoneSchema),
    tables: z.array(diningTableSchema),
    reservations: z.array(reservationSchema),
    activeFloorId: z.string().min(1),
  })
  .strict();

export const floorStructureInputSchema = z
  .object({
    floors: z.array(tableFloorSchema).min(1),
    zones: z.array(tableZoneSchema),
    activeFloorId: z.string().min(1),
  })
  .strict();

export type FloorStructureInput = z.infer<typeof floorStructureInputSchema>;
