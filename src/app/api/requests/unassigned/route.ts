/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/requests/unassigned/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, getPagination } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);

    const { data, error, count } = await serviceClient
      .from("requests")
      .select("*, user:user_id(id, full_name, username)", { count: "exact" })
      .is("assigned_staff_id", null)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Unassigned API error:", error);
      return apiError(error.message, 500);
    }

    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}
