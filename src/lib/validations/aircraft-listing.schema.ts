//src/lib/validations/aircraft-listing.schema.ts
import { z } from "zod";

export const createAircraftListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  aircraft_type_id: z.string().uuid().optional(),
  registration_number: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  price: z.number().positive().optional(),
  currency_code: z.string().default("USD"),
  images: z.array(z.string().url()).optional(),
  documents: z.array(z.string().url()).optional(),
  status: z.enum(["active", "sold", "inactive"]).default("active"),
});

export const updateAircraftListingSchema = createAircraftListingSchema.partial();

export type CreateAircraftListingInput = z.infer<typeof createAircraftListingSchema>;
export type UpdateAircraftListingInput = z.infer<typeof updateAircraftListingSchema>;
