//src/app/api/airports/search/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.length < 2) {
      return apiSuccess([]); // return empty if query too short
    }

    const { data, error } = await supabase
      .from("airports")
      .select("*")
      .or(
        `icao.ilike.%${q}%,iata.ilike.%${q}%,city.ilike.%${q}%,country.ilike.%${q}%,name.ilike.%${q}%`,
      )
      .limit(20);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
