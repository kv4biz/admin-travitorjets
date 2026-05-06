// src/lib/validations/aircraft-type.schema.ts
import { z } from "zod";

export const createAircraftTypeSchema = z.object({
  name: z.string().min(1),
  aircraft_class_id: z.string().uuid().optional(),
  manufacturer_name: z.string().optional(),
  range_maximum: z.coerce.number().positive().optional(),
  // altitude should likely stay integer
  altitude: z.coerce.number().int().positive().optional(),
  // passengers should stay integer
  pax_maximum: z.coerce.number().int().positive().optional(),

  // ✅ decimals allowed
  cabin_height: z.coerce.number().positive().optional(),
  cabin_length: z.coerce.number().positive().optional(),
  cabin_width: z.coerce.number().positive().optional(),
  luggage_volume: z.coerce.number().positive().optional(),
  images: z.array(z.string().url()).optional(),
  description: z.string().optional(),
  // speed should stay integer
  cruise_speed_kt: z.coerce.number().int().positive().optional(),
});

export const updateAircraftTypeSchema = createAircraftTypeSchema.partial();
