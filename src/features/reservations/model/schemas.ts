import * as z from "zod";

import { reservationTableSeed } from "../data/seed";

export const createReservationSchema = z
  .object({
    tableId: z.string().refine(
      (tableId) => reservationTableSeed.some((table) => table.id === tableId),
      "Выберите стол",
    ),
    guestName: z.string().trim().min(1, "Укажите имя гостя"),
    guestPhone: z.string().trim().min(1, "Укажите телефон"),
    guestsCount: z.number().int().positive("Укажите количество гостей"),
    reservationDate: z
      .string()
      .refine(
        (value) => !Number.isNaN(Date.parse(value)),
        "Укажите дату и время",
      ),
    durationMinutes: z.number().int().positive("Укажите длительность"),
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

export type CreateReservationFormValues = z.input<
  typeof createReservationSchema
>;
