import * as z from "zod";

const entityIdSchema = z.string().min(1);

export const createReservationSchema = z
  .object({
    tableId: z.string().min(1, "Выберите стол"),
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

export const updateReservationSchema = createReservationSchema;

export type UpdateReservationInput = z.infer<
  typeof updateReservationSchema
>;

export const reservationActionSchema = z
  .object({
    action: z.enum(["confirm", "complete", "cancel"]),
  })
  .strict();

export const reservationMutationSchema = z.union([
  reservationActionSchema,
  updateReservationSchema,
]);

export const reservationSchema = z
  .object({
    id: entityIdSchema,
    tableId: entityIdSchema,
    guestName: z.string().trim().min(1),
    guestPhone: z.string().trim().min(1),
    guestsCount: z.number().int().positive(),
    reservationDate: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value))),
    durationMinutes: z.number().int().positive(),
    comment: z.string().optional(),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]),
    createdAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value))),
  })
  .strict();
