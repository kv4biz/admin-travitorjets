//src/app/api/messages/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  parseBody,
} from "@/lib/api-utils";
import { createMessageSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get("request_id");

    if (!requestId) {
      return apiError("request_id is required", 400);
    }

    // Verify request exists (admin can see any request)
    const { error: requestError } = await supabase
      .from("requests")
      .select("id")
      .eq("id", requestId)
      .single();

    if (requestError) {
      if (requestError.code === "PGRST116") {
        return apiError("Request not found", 404);
      }
      return apiError(requestError.message, 500);
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess(data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) {
      return apiError(parseError, 400);
    }

    const validation = createMessageSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    // Verify request exists (admin can send to any request)
    const { error: requestError } = await supabase
      .from("requests")
      .select("id")
      .eq("id", validation.data.request_id)
      .single();

    if (requestError) {
      if (requestError.code === "PGRST116") {
        return apiError("Request not found", 404);
      }
      return apiError(requestError.message, 500);
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        request_id: validation.data.request_id,
        sender_id: user.id,
        content: validation.data.content,
        attachment_urls: validation.data.attachment_urls || null,
      })
      .select()
      .single();

    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess(data);
  });
}
