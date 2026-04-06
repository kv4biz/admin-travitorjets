//src/app/api/requests/[id]/close/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAdminAuth(async (_, supabase) => {
    // Only allowed if status is confirmed
    const { data: req, error: fetchError } = await supabase
      .from("requests")
      .select("status")
      .eq("id", params.id)
      .single();

    if (fetchError) return apiError(fetchError.message, 404);
    if (req.status !== "confirmed") {
      return apiError("Only confirmed requests can be closed", 400);
    }

    const { data, error } = await supabase
      .from("requests")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
