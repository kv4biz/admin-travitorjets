// src/lib/validations/empty-leg.schema.ts
import { z } from "zod";

const emptyLegBaseSchema = z.object({
  dep_airport_id: z.string().uuid(),
  arr_airport_id: z.string().uuid(),
  departure_time: z.string().datetime(),

  aircraft_type_id: z.string().uuid().optional(),
  aircraft_name: z.string().optional(),
  aircraft_category: z.string().optional(),
  aircraft_max_pax: z.number().int().positive().optional(),
  aircraft_image: z.string().url().optional(),

  available_seats: z.number().int().positive().optional(),
  total_seats: z.number().int().positive().optional(),

  price_type: z.enum(["fixed", "contact"]).default("fixed"),
  price: z.number().positive().optional(),

  currency_code: z.string().default("USD"),
  comment: z.string().optional(),
  destination_image_url: z.string().url().optional(),
  destination_description: z.string().optional(),
  is_public: z.boolean().optional(),
});

export const createEmptyLegSchema = emptyLegBaseSchema.refine(
  (data) => {
    if (data.price_type === "fixed") return data.price !== undefined && data.price > 0;
    return true;
  },
  { message: "Price is required when price type is fixed", path: ["price"] },
);

// FIXED: Only enforce price rule if price is being updated
export const updateEmptyLegSchema = emptyLegBaseSchema.partial().refine(
  (data) => {
    // Only check if price is present in the update
    if (data.price_type === "fixed" && data.price !== undefined) {
      return data.price > 0;
    }
    return true;
  },
  { message: "Price must be greater than zero for fixed price type", path: ["price"] },
);
