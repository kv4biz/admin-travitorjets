//src/lib/validations/aircraft-listing.schema.ts
import { z } from "zod";

// Schema for a single listing section
const listingSectionSchema = z.object({
  title: z.string().min(1, "Section title is required"),
  items: z.array(z.string().min(1, "List item cannot be empty")).min(1, "At least one item is required"),
});

export const createAircraftListingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  aircraft_type_id: z.string().uuid("Invalid aircraft type ID").optional(),
  serial_number: z.string().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  cabin_plan_image: z.string().url("Must be a valid URL").optional(), // single image URL
  listing_sections: z.array(listingSectionSchema).default([]),
  images: z.array(z.string().url()).optional(), // general photos
  documents: z.array(z.string().url()).optional(),
  status: z.enum(["active", "sold", "inactive"]).default("active"),
});

export const updateAircraftListingSchema = createAircraftListingSchema.partial();

export type CreateAircraftListingInput = z.infer<typeof createAircraftListingSchema>;
export type UpdateAircraftListingInput = z.infer<typeof updateAircraftListingSchema>;
