//src/app/api/invitations/route.ts
import { NextRequest } from "next/server";
import {
  withManagerAuth,
  apiSuccess,
  apiError,
  parseBody,
} from "@/lib/api-utils";
import { createInvitationSchema } from "@/lib/validations";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  return withManagerAuth(async (user, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = createInvitationSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        email: validation.data.email,
        token,
        role: validation.data.role,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    // TODO: send invitation email (use Edge Function or external service)
    return apiSuccess(data);
  });
}

export async function GET() {
  return withManagerAuth(async (_, supabase) => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
