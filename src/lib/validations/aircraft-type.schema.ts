//src/lib/validations/aircraft-type.schema.ts
import { z } from "zod";

export const createAircraftTypeSchema = z.object({
  name: z.string().min(1),
  icao: z.string().max(4).optional(),
  aircraft_class_id: z.string().uuid().optional(),
  manufacturer_name: z.string().optional(),
  range_maximum: z.number().int().positive().optional(),
  altitude: z.number().int().positive().optional(),
  pax_maximum: z.number().int().positive().optional(),
  cabin_height: z.number().positive().optional(),
  cabin_length: z.number().positive().optional(),
  cabin_width: z.number().positive().optional(),
  luggage_volume: z.number().positive().optional(),
  images: z.array(z.any()).optional(),
  description: z.string().optional(),
  cruise_speed_kt: z.number().int().positive().optional(),
});

export const updateAircraftTypeSchema = createAircraftTypeSchema.partial();

export type CreateAircraftTypeInput = z.infer<typeof createAircraftTypeSchema>;
export type UpdateAircraftTypeInput = z.infer<typeof updateAircraftTypeSchema>;
