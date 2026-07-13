import * as z from "zod";

const finiteNumberSchema = z.number().finite();
const entityIdSchema = z.string().min(1);

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

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type ZonePatchInput = z.infer<typeof zonePatchSchema>;
