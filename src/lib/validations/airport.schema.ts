//src/lib/validations/airport.schema.ts
import { z } from "zod";

export const AirportSchema = z.object({
  icao: z.string().min(1, "ICAO is required"),
  iata: z.string().optional(),
  lid: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  city: z.string().optional(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  size: z.string().optional(),
  continent: z.string().optional(),
});

// Export type for use in components
export type AirportFormValues = z.infer<typeof AirportSchema>;
