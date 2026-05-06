//src/app/api/requests/[id]/messages/read/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (user, supabase) => {
    // Mark all unread messages in this request not sent by current user as read
    const { error } = await supabase.from("messages").update({ read: true }).eq("request_id", id).eq("read", false).neq("sender_id", user.id);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ success: true });
  });
}
