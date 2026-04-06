//src/app/api/empty-legs/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  getPagination,
  parseBody,
} from "@/lib/api-utils";
import { createEmptyLegSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);
    let query = supabase.from("empty_legs").select("*", { count: "exact" });

    if (searchParams.has("dep_airport_id")) {
      query = query.eq("dep_airport_id", searchParams.get("dep_airport_id")!);
    }
    if (searchParams.has("arr_airport_id")) {
      query = query.eq("arr_airport_id", searchParams.get("arr_airport_id")!);
    }
    if (searchParams.has("from_date")) {
      query = query.gte("from_date_utc", searchParams.get("from_date")!);
    }
    if (searchParams.has("to_date")) {
      query = query.lte("to_date_utc", searchParams.get("to_date")!);
    }
    if (searchParams.has("source")) {
      query = query.eq("source", searchParams.get("source")!);
    }

    const { data, error, count } = await query
      .order("from_date_utc", { ascending: false })
      .range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
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

    const { data, error } = await supabase
      .from("empty_legs")
      .insert({ ...validation.data, created_by: user.id })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
