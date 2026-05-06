// src/app/api/aircraft-types/[id]/route.ts

import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { updateAircraftTypeSchema } from "@/lib/validations";
import { getPathFromUrl } from "@/lib/supabase/storage";
import { generateUniqueSlug } from "@/lib/utils/slugify";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }, // ← Promise type
) {
  const { id } = await context.params; // ← await the Promise

  return withAdminAuth(async (_, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    // Validate FIRST (partial schema)
    const validation = updateAircraftTypeSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const validData = validation.data;

    // Prevent empty update
    if (!validData || Object.keys(validData).length === 0) {
      return apiError("No fields provided for update", 400);
    }

    const updateData: Partial<typeof validData & { slug?: string }> = {
      ...validData,
    };

    // Only regenerate slug if name exists
    if (typeof validData.name === "string" && validData.name.trim().length > 0) {
      const slug = await generateUniqueSlug(
        supabase,
        "aircraft_types",
        [validData.name],
        "slug",
        id, // exclude current record
        { maxLength: 100 },
      );
      updateData.slug = slug;
    }

    const { data, error } = await supabase.from("aircraft_types").update(updateData).eq("id", id).select().single();

    if (error) return apiError(error.message, 500);

    return apiSuccess(data);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const bucket = "aircraft-images";

  return withAdminAuth(async (_, supabase) => {
    // 1. Fetch the record to get image URLs
    const { data: row, error: fetchError } = await supabase.from("aircraft_types").select("images").eq("id", id).single();

    if (fetchError) return apiError(fetchError.message, 500);

    // 2. Normalize images to array of strings
    const rawImages = row?.images;
    const imageUrls: string[] = Array.isArray(rawImages)
      ? rawImages.filter((v): v is string => typeof v === "string")
      : typeof rawImages === "string"
        ? [rawImages]
        : [];

    // 3. Extract storage paths
    const paths = imageUrls
      .map((url) => {
        try {
          return getPathFromUrl(url, bucket);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as string[];

    // 4. Delete files from storage (non‑blocking)
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from(bucket).remove(paths);
      if (storageError) {
        console.error("Storage delete error:", storageError);
      }
    }

    // 5. Delete the database row
    const { error: deleteError } = await supabase.from("aircraft_types").delete().eq("id", id);

    if (deleteError) return apiError(deleteError.message, 500);

    return apiSuccess({ success: true });
  });
}
