/* eslint-disable @typescript-eslint/no-unused-vars */

// src/app/api/staffs/invite/route.ts
import { NextRequest } from "next/server";
import { withManagerAuth, apiSuccess, apiError, parseBody } from "@/lib/api-utils";
import { inviteStaffSchema } from "@/lib/validations/staff.schema";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  return withManagerAuth(async (_, supabase) => {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = inviteStaffSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const { email, role } = validation.data;

    // ✅ Add redirectTo so the user lands on our callback page
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: { role },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback`, // e.g. http://localhost:3000/auth/callback
    });

    if (inviteError) {
      if (inviteError.message.includes("already been registered")) {
        return apiError("A user with this email already exists", 409);
      }
      return apiError(inviteError.message, 500);
    }

    const userId = inviteData.user.id;

    const { error: upsertError } = await serviceClient.from("profiles").upsert(
      {
        id: userId,
        role,
        onboarding_completed: false,
      },
      { onConflict: "id" },
    );

    if (upsertError) {
      console.error("Failed to upsert profile:", upsertError);
      return apiError("Invite sent, but failed to create profile record", 500);
    }

    return apiSuccess({ message: "Invitation sent", email, role });
  });
}
