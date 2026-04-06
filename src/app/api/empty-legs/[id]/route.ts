//src/app/api/empty-legs/[id]/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  parseBody,
} from "@/lib/api-utils";
import { updateEmptyLegSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (_, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = updateEmptyLegSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const { data, error } = await supabase
      .from("empty_legs")
      .update(validation.data)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (_, supabase) => {
    const { error } = await supabase
      .from("empty_legs")
      .delete()
      .eq("id", params.id);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ success: true });
  });
}
