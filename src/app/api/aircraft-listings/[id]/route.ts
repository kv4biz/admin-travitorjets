// src/app/api/aircraft-listings/[id]/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { updateAircraftListingSchema } from "@/lib/validations/aircraft-listing.schema";
import { getPathFromUrl } from "@/lib/supabase/storage";
import { generateUniqueSlug } from "@/lib/utils/slugify";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (_, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = updateAircraftListingSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const validData = validation.data;
    if (!validData || Object.keys(validData).length === 0) {
      return apiError("No fields provided for update", 400);
    }

    const updateData: Record<string, unknown> = { ...validData };

    // Regenerate slug if title changed
    if (typeof validData.title === "string" && validData.title.trim().length > 0) {
      updateData.slug = await generateUniqueSlug(supabase, "aircraft_listings", [validData.title], "slug", id, { maxLength: 100 });
    }

    const { data, error } = await supabase.from("aircraft_listings").update(updateData).eq("id", id).select().single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const bucket = "aircraft-listings";

  return withAdminAuth(async (_, supabase) => {
    // 1. Fetch the record – include cabin_plan_image now
    const { data: row, error: fetchError } = await supabase
      .from("aircraft_listings")
      .select("images, documents, cabin_plan_image")
      .eq("id", id)
      .single();

    if (fetchError) return apiError(fetchError.message, 500);

    // 2. Normalize all file URLs to a flat array of strings
    const extractUrls = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.filter((v): v is string => typeof v === "string");
      }
      if (typeof value === "string") {
        return [value];
      }
      return [];
    };

    const imageUrls = extractUrls(row?.images);
    const docUrls = extractUrls(row?.documents);
    const cabinPlanUrls = extractUrls(row?.cabin_plan_image); // single URL as array

    const allUrls = [...imageUrls, ...docUrls, ...cabinPlanUrls];

    // 3. Extract storage paths
    const paths = allUrls
      .map((url) => {
        try {
          return getPathFromUrl(url, bucket);
        } catch {
          return null;
        }
      })
      .filter((p): p is string => p !== null);

    // 4. Delete files from storage (non‑blocking)
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from(bucket).remove(paths);
      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue with DB deletion
      }
    }

    // 5. Delete the database row
    const { error: deleteError } = await supabase.from("aircraft_listings").delete().eq("id", id);

    if (deleteError) return apiError(deleteError.message, 500);

    return apiSuccess({ success: true });
  });
}
