//src/app/api/invitations/[token]/accept/route.ts
import { NextRequest } from "next/server";
import { apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { acceptInvitationSchema } from "@/lib/validations";
import { createClient } from "@/lib/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const supabase = await createClient();

  // First validate the invitation
  const { data: invitation, error: invError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", params.token)
    .single();

  if (
    invError ||
    !invitation ||
    invitation.used_at ||
    new Date(invitation.expires_at) < new Date()
  ) {
    return apiError("Invalid or expired invitation", 400);
  }

  const { data: body, error: parseError } = await parseBody(request);
  if (parseError) return apiError(parseError, 400);

  const validation = acceptInvitationSchema.safeParse(body);
  if (!validation.success) {
    return apiError(validation.error.issues[0].message, 400);
  }

  // Create the user in auth
  const { data: authUser, error: signUpError } =
    await supabase.auth.admin.createUser({
      email: invitation.email,
      password: validation.data.password,
      email_confirm: true,
    });

  if (signUpError) return apiError(signUpError.message, 400);

  // Update profile role (already set by trigger, but we update explicitly)
  await supabase
    .from("profiles")
    .update({ role: invitation.role })
    .eq("id", authUser.user.id);

  // Mark invitation as used
  await supabase
    .from("invitations")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return apiSuccess({ message: "Account created successfully" });
}
