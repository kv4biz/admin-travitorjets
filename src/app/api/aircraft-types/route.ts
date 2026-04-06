//src/app/api/aircraft-types/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  getPagination,
  parseBody,
} from "@/lib/api-utils";
import { createAircraftTypeSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);

    const { data, error, count } = await supabase
      .from("aircraft_types")
      .select("*, aircraft_class:aircraft_class_id(*)", { count: "exact" })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = createAircraftTypeSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const { data, error } = await supabase
      .from("aircraft_types")
      .insert(validation.data)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
