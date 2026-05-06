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
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    const filterSize = searchParams.get("filter_size");
    const filterContinent = searchParams.get("filter_continent");

    let query = supabase.from("airports").select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `icao.ilike.%${search}%,iata.ilike.%${search}%,name.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`,
      );
    }

    if (filterSize) {
      const sizes = filterSize.split(",");
      query = query.in("size", sizes);
    }

    if (filterContinent) {
      const continents = filterContinent.split(",");
      query = query.in("continent", continents);
    }

    if (sortBy && typeof sortBy === "string") {
      const validColumns = [
        "icao",
        "iata",
        "name",
        "city",
        "country",
        "size",
        "continent",
      ];
      if (validColumns.includes(sortBy)) {
        query = query.order(sortBy, { ascending: sortOrder === "asc" });
      } else {
        query = query.order("name", { ascending: true });
      }
    } else {
      query = query.order("name", { ascending: true });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}
