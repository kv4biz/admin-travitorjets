//src/app/api/invitations/[token]/route.ts
import { NextRequest } from "next/server";
import { apiSuccess, apiError, withManagerAuth } from "@/lib/api-utils";
import { createClient } from "@/lib/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", params.token)
    .single();

  if (
    error ||
    !data ||
    data.used_at ||
    new Date(data.expires_at) < new Date()
  ) {
    return apiError("Invalid or expired invitation", 404);
  }

  return apiSuccess({ email: data.email, role: data.role });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  return withManagerAuth(async (_, supabase) => {
    const { error } = await supabase
      .from("invitations")
      .delete()
      .eq("token", params.token);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ success: true });
  });
}
