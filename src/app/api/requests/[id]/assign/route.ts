//src/app/api/requests/[id]/assign/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  parseBody,
} from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (user, supabase) => {
    const { data: body } = await parseBody<{ staff_id?: string }>(request);
    const staffId = body?.staff_id || user.id; // if no staff_id, assign to self

    // Optional: check if manager is required to assign to someone else
    // For simplicity, any admin can assign to any staff (including themselves)
    const { data, error } = await supabase
      .from("requests")
      .update({ assigned_staff_id: staffId, status: "assigned" })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
