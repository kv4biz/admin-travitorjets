// src/app/api/requests/[id]/close/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (user, supabase) => {
    const { data: reqData, error: fetchError } = await supabase.from("requests").select("status, assigned_staff_id").eq("id", id).single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") return apiError("Request not found", 404);
      return apiError(fetchError.message, 500);
    }
    if (reqData.assigned_staff_id !== user.id) return apiError("Only assigned staff can close this request", 403);
    if (reqData.status === "closed") return apiError("Request already closed", 400);

    const { data, error } = await supabase
      .from("requests")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);

    // Insert system message using service client (bypass RLS)
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const senderName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Staff";

    await serviceClient.from("messages").insert({
      request_id: id,
      sender_id: user.id,
      content: `Request closed by ${senderName}`,
      message_type: "system",
    });

    return apiSuccess(data);
  });
}
