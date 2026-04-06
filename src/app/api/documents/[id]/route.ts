//src/app/api/document/[id]/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (_, supabase) => {
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", params.id);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ success: true });
  });
}
