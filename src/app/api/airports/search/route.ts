// src/app/api/airports/search/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim();

  if (!q) return apiSuccess([]);

  // Use service‑role client to bypass any RLS
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

  const pattern = `%${q}%`;

  const { data, error } = await supabase
    .from("airports")
    .select("id, name, iata, icao, city, country, latitude, longitude")
    .or(`iata.ilike.${pattern},icao.ilike.${pattern},city.ilike.${pattern},country.ilike.${pattern},name.ilike.${pattern}`)
    .limit(25);

  if (error) {
    console.error("Airport search error:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
}
