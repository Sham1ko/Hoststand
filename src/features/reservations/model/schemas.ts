import * as z from "zod";

import { reservationTableSeed } from "../data/seed";

export const createReservationSchema = z
  .object({
    tableId: z.string().refine(
      (tableId) => reservationTableSeed.some((table) => table.id === tableId),
      "Стол не найден",
    ),
    guestName: z.string().trim().min(1),
    guestPhone: z.string().trim().min(1),
    guestsCount: z.number().int().positive(),
    reservationDate: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value))),
    durationMinutes: z.number().int().positive(),
    comment: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
  })
  .strict();

export type CreateReservationInput = z.infer<
  typeof createReservationSchema
>;
