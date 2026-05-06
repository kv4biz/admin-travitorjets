//src/app/api/requests/[id]/messages/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
  attachment_urls: z.array(z.string().url()).optional(),
});

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (_, supabase) => {
    const { data: reqExists } = await supabase.from("requests").select("id").eq("id", id).single();

    if (!reqExists) return apiError("Request not found", 404);

    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:sender_id(id, full_name, username, avatar_url)")
      .eq("request_id", id)
      .order("created_at", { ascending: true });

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return withAdminAuth(async (user, supabase) => {
    // 1. Parse body
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    // 2. Verify request is assigned to current user
    const { data: reqData, error: reqError } = await supabase.from("requests").select("assigned_staff_id, status").eq("id", id).single();

    if (reqError || !reqData) {
      console.error("❌ Request not found or error:", reqError);
      return apiError("Request not found", 404);
    }
    if (!reqData.assigned_staff_id) {
      return apiError("Request is not assigned", 400);
    }
    if (reqData.assigned_staff_id !== user.id) {
      return apiError("You are not assigned to this request", 403);
    }
    if (reqData.status === "closed") {
      return apiError("Cannot send messages to a closed request", 400);
    }

    // 3. Insert message using service client (bypasses RLS)
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const { data, error } = await serviceClient
      .from("messages")
      .insert({
        request_id: id,
        sender_id: user.id,
        content: validation.data.content,
        attachment_urls: validation.data.attachment_urls ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Message insert error:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess(data);
  });
}
