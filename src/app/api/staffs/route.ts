//src/app/api/staffs/route.ts
import { NextRequest } from "next/server";
import {
  withManagerAuth,
  apiSuccess,
  apiError,
  getPagination,
} from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  return withManagerAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);

    const { data, error, count } = await supabase
      .from("profiles")
      .select("*")
      .in("role", ["staff", "manager"])
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}
