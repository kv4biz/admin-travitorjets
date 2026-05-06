//src/app/api/airports/[id]/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Next.js 15 – params is a Promise

  return withAdminAuth(async (_, supabase) => {
    const { data, error } = await supabase.from("airports").select("*").eq("id", id).single();

    if (error) return apiError(error.message, 404);
    return apiSuccess(data);
  });
}
