import * as z from "zod";

const entityIdSchema = z.string().min(1);

export const tableFloorSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().min(1),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
  })
  .strict();
