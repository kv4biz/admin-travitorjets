//src/app/api/contacts/route.ts
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
    const sortOrder = searchParams.get("sort") === "asc" ? "asc" : "desc";

    const { data, error, count } = await supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: sortOrder === "asc" })
      .range(from, to);

    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}
