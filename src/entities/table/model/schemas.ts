import * as z from "zod";

const finiteNumberSchema = z.number().finite();
const entityIdSchema = z.string().min(1);

export const tableStatusSchema = z.enum([
  "FREE",
  "OCCUPIED",
  "RESERVED",
  "BANQUET",
  "MANUAL_BLOCKED",
  "INACTIVE",
]);

export const tableShapeSchema = z.enum(["round", "square", "rect"]);

const tableLayoutSchema = z
  .object({
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    w: finiteNumberSchema.min(40),
    h: finiteNumberSchema.min(40),
    rotation: finiteNumberSchema,
    shape: tableShapeSchema,
  })
  .strict();

const tableLayoutPatchSchema = z
  .object({
    x: finiteNumberSchema.optional(),
    y: finiteNumberSchema.optional(),
    w: finiteNumberSchema.min(40).optional(),
    h: finiteNumberSchema.min(40).optional(),
    rotation: finiteNumberSchema.optional(),
    shape: tableShapeSchema.optional(),
  })
  .strict()
  .refine((layout) => Object.values(layout).some((value) => value !== undefined));

export const tablePatchSchema = z
  .object({
    number: z.number().int().positive().optional(),
    capacity: z.number().int().positive().optional(),
    status: tableStatusSchema.optional(),
    layout: tableLayoutPatchSchema.optional(),
  })
  .strict()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined));

export const createTableSchema = z
  .object({
    number: z.number().int().positive(),
    capacity: z.number().int().positive(),
    floorId: entityIdSchema,
    status: tableStatusSchema,
    layout: tableLayoutSchema,
  })
  .strict();

export const diningTableSchema = createTableSchema.extend({
  id: entityIdSchema,
  zoneId: entityIdSchema.optional(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type TablePatchInput = z.infer<typeof tablePatchSchema>;
