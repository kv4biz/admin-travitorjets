//src/app/api/requests/route.ts
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
    const status = searchParams.get("status") as
      | "open"
      | "assigned"
      | "confirmed"
      | "closed"
      | null;
    const type = searchParams.get("type") as
      | "charter"
      | "empty_leg_inquiry"
      | "aircraft_inquiry"
      | null;
    const assignedStaff = searchParams.get("assigned_staff_id");

    let query = supabase.from("requests").select("*", { count: "exact" });

    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    if (assignedStaff) query = query.eq("assigned_staff_id", assignedStaff);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}
