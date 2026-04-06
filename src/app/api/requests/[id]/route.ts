//src/app/api/requests/[id]/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  parseBody,
} from "@/lib/api-utils";
import { updateRequestSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (_, supabase) => {
    const { data, error } = await supabase
      .from("requests")
      .select("*, messages(*), invoices(*)")
      .eq("id", params.id)
      .single();

    if (error) return apiError(error.message, 404);
    return apiSuccess(data);
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (user, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = updateRequestSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    // If assigning to a different staff, ensure manager permission (optional: we can allow any admin)
    const { data, error } = await supabase
      .from("requests")
      .update(validation.data)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
