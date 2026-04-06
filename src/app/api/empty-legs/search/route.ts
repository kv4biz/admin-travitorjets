//src/app/api/empty-legs/search/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.length < 2) return apiSuccess([]);

    const { data, error } = await supabase
      .from("empty_legs")
      .select("*, dep_airport:dep_airport_id(*), arr_airport:arr_airport_id(*)")
      .or(
        `comment.ilike.%${q}%,destination_description.ilike.%${q}%,dep_airport_icao.ilike.%${q}%,arr_airport_icao.ilike.%${q}%`,
      )
      .limit(20);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
