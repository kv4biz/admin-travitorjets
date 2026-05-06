//src/app/api/analytics/performance/route.ts
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest } from "next/server";
import { withManagerAuth, apiSuccess } from "@/lib/api-utils";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  return withManagerAuth(async (user, supabase) => {
    const serviceClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    // -----------------------------
    // 1. TOTAL USERS
    // -----------------------------
    const { count: totalUsers } = await serviceClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user");

    // -----------------------------
    // 2. TOTAL ADMINS
    // -----------------------------
    const { count: totalAdmins } = await serviceClient.from("profiles").select("id", { count: "exact", head: true }).in("role", ["staff", "manager"]);

    // -----------------------------
    // 3. FETCH ADMINS
    // -----------------------------
    const { data: admins } = await serviceClient.from("profiles").select("id, full_name, username, role").in("role", ["staff", "manager"]);

    // -----------------------------
    // 4. FETCH CONFIRMED INVOICES ONCE (IMPORTANT FIX)
    // -----------------------------
    const { data: confirmedInvoices } = await serviceClient.from("invoices").select("request_id").eq("status", "confirmed");

    const confirmedRequestIds = new Set((confirmedInvoices ?? []).map((i) => i.request_id));

    // -----------------------------
    // 5. ADMIN PERFORMANCE
    // -----------------------------
    const adminPerformance = [];

    for (const admin of admins ?? []) {
      // total assigned requests
      const { count: totalRequests } = await serviceClient
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("assigned_staff_id", admin.id);

      // closed requests for this admin
      const { data: closedRequests } = await serviceClient
        .from("requests")
        .select("id, status")
        .eq("assigned_staff_id", admin.id)
        .eq("status", "closed");

      const closedList = closedRequests ?? [];

      // confirmed vs not confirmed (FAST JS LOOKUP)
      const closedWithConfirmed = closedList.filter((r) => confirmedRequestIds.has(r.id)).length;

      const closedWithoutConfirmed = closedList.length - closedWithConfirmed;

      adminPerformance.push({
        id: admin.id,
        full_name: admin.full_name || admin.username || "Unknown",
        totalRequests: totalRequests ?? 0,
        closedWithConfirmed,
        closedWithoutConfirmed,
      });
    }

    // -----------------------------
    // 6. MONTHLY REQUESTS (LAST 12 MONTHS)
    // -----------------------------
    const months = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const { count } = await serviceClient
        .from("requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      months.push({
        month: start.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count: count ?? 0,
      });
    }

    // -----------------------------
    // 7. REQUEST TYPE BREAKDOWN
    // -----------------------------
    const { data: typeData } = await serviceClient.from("requests").select("type");

    const typeCount: Record<string, number> = {};

    for (const req of typeData ?? []) {
      typeCount[req.type] = (typeCount[req.type] || 0) + 1;
    }

    const typeBreakdown = Object.entries(typeCount).map(([type, count]) => ({
      type: type.replace(/_/g, " "),
      count,
    }));

    // -----------------------------
    // FINAL RESPONSE
    // -----------------------------
    return apiSuccess({
      totalUsers: totalUsers ?? 0,
      totalAdmins: totalAdmins ?? 0,
      adminPerformance,
      monthlyRequests: months,
      typeBreakdown,
    });
  });
}
