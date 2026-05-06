// src/app/api/empty-legs/[id]/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { updateEmptyLegSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (_, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = updateEmptyLegSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    // Reject empty updates
    if (!validation.data || Object.keys(validation.data).length === 0) {
      return apiError("No fields provided for update", 400);
    }

    // Only admin‑sourced records can be edited
    const { data: existing } = await supabase.from("empty_legs").select("source").eq("id", id).single();
    if (existing?.source !== "admin") {
      return apiError("Cannot edit PexJet records", 403);
    }

    const { data, error } = await supabase.from("empty_legs").update(validation.data).eq("id", id).select().single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (_, supabase) => {
    const { data: existing } = await supabase.from("empty_legs").select("source").eq("id", id).single();
    if (existing?.source !== "admin") {
      return apiError("Cannot delete PexJet records", 403);
    }

    const { error } = await supabase.from("empty_legs").delete().eq("id", id);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ success: true });
  });
}
