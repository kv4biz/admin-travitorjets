//src/lib/validations/empty-leg.schema.ts
import { z } from "zod";

const emptyLegBaseSchema = z.object({
  source: z.enum(["admin", "pexjet"]),
  is_public: z.boolean().optional(),
  aircraft_type_id: z.string().uuid().optional(),
  dep_airport_id: z.string().uuid(),
  arr_airport_id: z.string().uuid().optional(),
  from_date_utc: z.string().datetime(),
  to_date_utc: z.string().datetime(),
  price_type: z.enum(["fixed", "contact"]).optional(),
  price: z.number().positive().optional(),
  currency_code: z.string().default("USD"),
  comment: z.string().optional(),
  destination_image_url: z.string().url().optional(),
  destination_description: z.string().optional(),
});

export const createEmptyLegSchema = emptyLegBaseSchema.refine(
  (data) => data.price_type !== "fixed" || data.price !== undefined,
  {
    message: "Price is required when price_type is fixed",
    path: ["price"],
  },
);

export const updateEmptyLegSchema = emptyLegBaseSchema
  .partial()
  .refine((data) => data.price_type !== "fixed" || data.price !== undefined, {
    message: "Price is required when price_type is fixed",
    path: ["price"],
  });

export type CreateEmptyLegInput = z.infer<typeof createEmptyLegSchema>;
export type UpdateEmptyLegInput = z.infer<typeof updateEmptyLegSchema>;
