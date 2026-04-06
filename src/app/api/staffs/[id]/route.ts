//src/app/api/staffs/[id]/route.ts
import { NextRequest } from "next/server";
import { withManagerAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withManagerAuth(async (_, supabase) => {
    const { error } = await supabase.from("profiles").delete().eq("id", params.id);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ success: true });
  });
}
