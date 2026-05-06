/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/empty-legs/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, getPagination, parseBody } from "@/lib/api-utils";
import { createEmptyLegSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);

    // Custom search params
    const dep_lat = searchParams.get("dep_lat");
    const dep_lng = searchParams.get("dep_lng");
    const arr_lat = searchParams.get("arr_lat");
    const arr_lng = searchParams.get("arr_lng");
    const date = searchParams.get("date");
    const radiusKm = Number(searchParams.get("radius_km")) || 50;

    // Filters from TableRenderer
    const source = searchParams.get("filter_source") || searchParams.get("source");
    const priceType = searchParams.get("filter_price_type") || searchParams.get("price_type");
    const minSeats = searchParams.get("min_seats");
    const maxPrice = searchParams.get("max_price");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "departure_time";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // Validate sort column against allowed list
    const allowedSorts = ["departure_time", "price", "available_seats"];
    const orderColumn = allowedSorts.includes(sortBy) ? sortBy : "departure_time";

    let query = supabase.from("empty_legs").select(
      `*, dep_airport:airports!empty_legs_dep_airport_id_fkey(latitude,longitude,name,iata,icao,city),
         arr_airport:airports!empty_legs_arr_airport_id_fkey(latitude,longitude,name,iata,icao,city)`,
      { count: "exact" },
    );

    // Apply filters
    if (source) query = query.eq("source", source);
    if (priceType) query = query.eq("price_type", priceType);
    if (minSeats) query = query.gte("available_seats", Number(minSeats));
    if (maxPrice) query = query.lte("price", Number(maxPrice));

    // Date window
    if (date) {
      const base = new Date(date);
      const fromDate = new Date(base);
      fromDate.setDate(base.getDate() - 2);
      const toDate = new Date(base);
      toDate.setDate(base.getDate() + 2);
      query = query.gte("departure_time", fromDate.toISOString()).lte("departure_time", toDate.toISOString());
    }

    const { data, error, count } = await query.order(orderColumn, { ascending: sortOrder === "asc" }).range(from, to);

    if (error) return apiError(error.message, 500);

    // In-memory radius filter
    function withinRadius(lat1: number, lon1: number, lat2: number, lon2: number, km: number) {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= km;
    }

    let filtered = data || [];

    if (dep_lat && dep_lng) {
      filtered = filtered.filter((leg: any) => {
        if (!leg.dep_airport) return false;
        return withinRadius(Number(dep_lat), Number(dep_lng), Number(leg.dep_airport.latitude), Number(leg.dep_airport.longitude), radiusKm);
      });
    }

    if (arr_lat && arr_lng) {
      filtered = filtered.filter((leg: any) => {
        if (!leg.arr_airport) return false;
        return withinRadius(Number(arr_lat), Number(arr_lng), Number(leg.arr_airport.latitude), Number(leg.arr_airport.longitude), radiusKm);
      });
    }

    return apiSuccess(filtered, { page, limit, total: count || 0 });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = createEmptyLegSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    // Generate slug: dep city to arr city + date + random suffix
    const { data: depAirport } = await supabase.from("airports").select("city").eq("id", validation.data.dep_airport_id).single();
    const { data: arrAirport } = await supabase.from("airports").select("city").eq("id", validation.data.arr_airport_id).single();
    const depCity = depAirport?.city?.toLowerCase().replace(/\s+/g, "-") || "unknown";
    const arrCity = arrAirport?.city?.toLowerCase().replace(/\s+/g, "-") || "unknown";
    const datePart = validation.data.departure_time.substring(0, 10); // YYYY-MM-DD
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${depCity}-to-${arrCity}-${datePart}-ic-${randomSuffix}`;

    const { data, error } = await supabase
      .from("empty_legs")
      .insert({
        ...validation.data,
        slug,
        source: "admin",
        owner_type: "admin",
        created_by: user.id,
        is_public: true,
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
