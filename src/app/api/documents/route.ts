//src/app/api/document/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  getPagination,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);
    let query = supabase
      .from("documents")
      .select(
        "*, user:user_id(*), request:request_id(*), invoice:invoice_id(*)",
        { count: "exact" },
      );

    if (searchParams.has("type")) {
      query = query.eq("type", searchParams.get("type")!);
    }
    if (searchParams.has("user_id")) {
      query = query.eq("user_id", searchParams.get("user_id")!);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}
