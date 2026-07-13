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

export const zoneRectSchema = z
  .object({
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    w: finiteNumberSchema,
    h: finiteNumberSchema,
  })
  .strict();

const zoneFields = {
  floorId: entityIdSchema,
  name: z.string().trim().min(1),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  rect: zoneRectSchema,
};

export const createZoneSchema = z.object(zoneFields).strict();

export const zonePatchSchema = z
  .object({
    name: zoneFields.name.optional(),
    color: zoneFields.color.optional(),
    rect: zoneRectSchema.optional(),
  })
  .strict()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined));

export const tableZoneSchema = createZoneSchema.extend({
  id: entityIdSchema,
  rect: zoneRectSchema.optional(),
});

export const tableFloorSchema = z
  .object({
    id: entityIdSchema,
    name: z.string().min(1),
    sortOrder: z.number().int(),
    isActive: z.boolean(),
  })
  .strict();

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type TablePatchInput = z.infer<typeof tablePatchSchema>;
export type ZonePatchInput = z.infer<typeof zonePatchSchema>;
