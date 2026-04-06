//src/app/api/staffs/[id]/role/route.ts
import { NextRequest } from "next/server";
import {
  withManagerAuth,
  apiSuccess,
  apiError,
  parseBody,
} from "@/lib/api-utils";
import { updateStaffRoleSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withManagerAuth(async (_, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = updateStaffRoleSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ role: validation.data.role })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
