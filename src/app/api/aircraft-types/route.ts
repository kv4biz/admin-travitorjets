//src/app/api/aircraft-types/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, getPagination, parseBody } from "@/lib/api-utils";
import { createAircraftTypeSchema } from "@/lib/validations";
import { generateUniqueSlug } from "@/lib/utils/slugify";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    const filterClass = searchParams.get("filter_aircraft_class_id");
    let query = supabase.from("aircraft_types").select("*, aircraft_class:aircraft_class_id(*)", { count: "exact" });
    // Apply search
    if (search) {
      query = query.or(`name.ilike.%${search}%,manufacturer_name.ilike.%${search}%`);
    }
    // Apply filter by aircraft class
    if (filterClass) {
      const classIds = filterClass.split(",");
      query = query.in("aircraft_class_id", classIds);
    }
    // Apply sorting
    if (sortBy && typeof sortBy === "string") {
      // Validate column name to prevent SQL injection (Supabase handles it safely, but we restrict)
      const validColumns = ["name", "manufacturer_name", "range_maximum", "pax_maximum", "cruise_speed_kt", "created_at"];
      if (validColumns.includes(sortBy)) {
        query = query.order(sortBy, { ascending: sortOrder === "asc" });
      } else {
        // fallback to default sort by name
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

export async function POST(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    // ✅ Validate FIRST
    const validation = createAircraftTypeSchema.safeParse(body);

    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const validData = validation.data;

    // ✅ THEN generate slug safely
    const slug = await generateUniqueSlug(supabase, "aircraft_types", [validData.name], "slug", undefined, { maxLength: 100 });

    const { data, error } = await supabase
      .from("aircraft_types")
      .insert({
        ...validData,
        slug,
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
