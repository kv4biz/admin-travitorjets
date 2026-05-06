// src/lib/utils/slugify.ts
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Convert a string to a URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Options for generating a slug from multiple fields
 */
export type SlugGeneratorOptions = {
  /** Separator between combined fields (default: '-') */
  separator?: string;
  /** Maximum length of the generated slug (default: 100) */
  maxLength?: number;
  /** Whether to add a random suffix to ensure uniqueness (default: false) */
  addRandomSuffix?: boolean;
  /** Custom slugify function (default: uses the slugify function above) */
  customSlugify?: (text: string) => string;
};

/**
 * Generate a slug from one or more field values
 * @param values - Array of string values to combine (e.g., [name, manufacturer])
 * @param options - Configuration options
 * @returns Combined and slugified string
 */
export function generateSlugFromFields(values: (string | null | undefined)[], options: SlugGeneratorOptions = {}): string {
  const { separator = "-", maxLength = 100, customSlugify = slugify } = options;

  // Filter out null/undefined/empty values and slugify each
  const slugifiedParts = values.filter((v) => v && v.trim().length > 0).map((v) => customSlugify(v!.trim()));

  let combinedSlug = slugifiedParts.join(separator);

  // Trim to max length
  if (combinedSlug.length > maxLength) {
    combinedSlug = combinedSlug.substring(0, maxLength).replace(/-+$/, "");
  }

  return combinedSlug;
}

/**
 * Generate a unique slug for any table with flexible field combinations
 * @param supabase - Supabase client instance
 * @param tableName - Name of the table (e.g., 'aircraft_types', 'aircraft_classes')
 * @param fieldValues - Array of field values to combine for the slug (e.g., [name, manufacturer_name])
 * @param slugField - The slug field name (default: 'slug')
 * @param currentId - Current record ID (for updates, to exclude current record)
 * @param options - Slug generation options
 * @returns A unique slug
 */
export async function generateUniqueSlug(
  supabase: SupabaseClient,
  tableName: string,
  fieldValues: (string | null | undefined)[],
  slugField: string = "slug",
  currentId?: string,
  options: SlugGeneratorOptions = {},
): Promise<string> {
  let baseSlug = generateSlugFromFields(fieldValues, options);

  // Add random suffix if requested
  if (options.addRandomSuffix) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    baseSlug = `${baseSlug}-${randomSuffix}`;
  }

  let uniqueSlug = baseSlug;
  let counter = 1;
  let exists = true;

  while (exists) {
    // Build query to check if slug exists
    let query = supabase.from(tableName).select("id").eq(slugField, uniqueSlug);

    // Exclude current record when updating
    if (currentId) {
      query = query.neq("id", currentId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      exists = false;
    } else {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  return uniqueSlug;
}

/**
 * Simplified version for single-field slug generation (backwards compatible)
 */
export async function generateUniqueSlugFromField(
  supabase: SupabaseClient,
  tableName: string,
  fieldValue: string,
  slugField: string = "slug",
  currentId?: string,
  options?: SlugGeneratorOptions,
): Promise<string> {
  return generateUniqueSlug(supabase, tableName, [fieldValue], slugField, currentId, options);
}

/**
 * Helper to create a slug generator for a specific table
 * @returns A configured slug generator function
 */
export function createSlugGenerator(supabase: SupabaseClient, tableName: string) {
  return {
    /**
     * Generate a unique slug from multiple fields
     */
    fromFields: async (
      fieldValues: (string | null | undefined)[],
      slugField: string = "slug",
      currentId?: string,
      options?: SlugGeneratorOptions,
    ) => {
      return generateUniqueSlug(supabase, tableName, fieldValues, slugField, currentId, options);
    },

    /**
     * Generate a unique slug from a single field
     */
    fromField: async (fieldValue: string, slugField: string = "slug", currentId?: string, options?: SlugGeneratorOptions) => {
      return generateUniqueSlug(supabase, tableName, [fieldValue], slugField, currentId, options);
    },
  };
}
