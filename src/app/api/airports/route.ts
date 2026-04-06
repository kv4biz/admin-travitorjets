//src/app/api/airports/route.ts
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

    const { data, error, count } = await supabase
      .from("airports")
      .select("*", { count: "exact" })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}
