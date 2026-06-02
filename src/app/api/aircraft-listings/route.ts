// src/app/api/aircraft-listings/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, getPagination, parseBody } from "@/lib/api-utils";
import { createAircraftListingSchema } from "@/lib/validations/aircraft-listing.schema";
import { generateUniqueSlug } from "@/lib/utils/slugify";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);
    const search = searchParams.get("search") || "";
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    const filterStatus = searchParams.get("filter_status");
    const filterAircraftType = searchParams.get("filter_aircraft_type_id");

    let query = supabase.from("aircraft_listings").select("*, aircraft_type:aircraft_type_id(*)", { count: "exact" });

    // ✅ Search – now on title and serial_number (no registration_number)
    if (search) {
      query = query.or(`title.ilike.%${search}%,serial_number.ilike.%${search}%`);
    }

    // ✅ Filter by status
    if (filterStatus) {
      const statuses = filterStatus.split(",");
      query = query.in("status", statuses);
    }

    // ✅ Filter by aircraft type
    if (filterAircraftType) {
      const typeIds = filterAircraftType.split(",");
      query = query.in("aircraft_type_id", typeIds);
    }

    // ✅ Sorting – remove price and registration_number, add serial_number
    const validColumns = ["title", "serial_number", "year", "status", "created_at", "slug"];
    if (sortBy && validColumns.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = createAircraftListingSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const validData = validation.data;

    // Generate slug from title
    const slug = await generateUniqueSlug(supabase, "aircraft_listings", [validData.title], "slug", undefined, { maxLength: 100 });

    const { data, error } = await supabase
      .from("aircraft_listings")
      .insert({
        ...validData,
        slug,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}
