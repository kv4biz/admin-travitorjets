// src/app/api/staffs/[id]/route.ts
import { NextRequest } from "next/server";
import { withManagerAuth, apiSuccess, apiError } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withManagerAuth(async (_, supabase) => {
    // Service‑role client required for auth.admin.deleteUser
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    // Delete auth user first (cascades to profiles if foreign key is on delete CASCADE – but we do it manually)
    const { error: authError } = await serviceClient.auth.admin.deleteUser(id);
    if (authError) return apiError(authError.message, 500);

    // Delete profile row (may already be gone due to cascade, but safe)
    const { error: dbError } = await supabase.from("profiles").delete().eq("id", id);
    if (dbError) console.error("Profile cleanup failed:", dbError);

    return apiSuccess({ success: true });
  });
}
