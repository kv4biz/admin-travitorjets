// src/app/api/requests/[id]/claim/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (user, supabase) => {
    // Verify request is open/unassigned
    const { data: reqData, error: fetchError } = await supabase.from("requests").select("status, assigned_staff_id").eq("id", id).single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") return apiError("Request not found", 404);
      return apiError(fetchError.message, 500);
    }
    if (reqData.assigned_staff_id) return apiError("Request already assigned", 400);
    if (reqData.status !== "open") return apiError("Request is not open", 400);

    // Assign to current user
    const { data, error } = await supabase.from("requests").update({ assigned_staff_id: user.id, status: "assigned" }).eq("id", id).select().single();

    if (error) return apiError(error.message, 500);

    // Insert system message
    await supabase.from("messages").insert({
      request_id: id,
      sender_id: user.id,
      content: `${user.user_metadata?.full_name || "Staff"} claimed the request`,
      message_type: "system",
    });

    return apiSuccess(data);
  });
}
