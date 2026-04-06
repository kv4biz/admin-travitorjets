//src/app/api/invitations/[token]/resend/route.ts
import { NextRequest } from "next/server";
import { withManagerAuth, apiSuccess, apiError } from "@/lib/api-utils";
import { randomBytes } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  return withManagerAuth(async (_, supabase) => {
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", params.token)
      .single();

    if (fetchError) return apiError("Invitation not found", 404);
    if (invitation.used_at) return apiError("Invitation already used", 400);

    // Regenerate token and extend expiry
    const newToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: updateError } = await supabase
      .from("invitations")
      .update({ token: newToken, expires_at: expiresAt.toISOString() })
      .eq("id", invitation.id);

    if (updateError) return apiError(updateError.message, 500);

    // TODO: send new email
    return apiSuccess({ message: "Invitation resent", token: newToken });
  });
}
