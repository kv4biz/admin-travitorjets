//src/app/api/analytics/staff-performance/route.ts
import { withManagerAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  return withManagerAuth(async (_, supabase) => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("admin_activities")
      .select("staff_id, action")
      .gte("created_at", since);

    if (error) return apiError(error.message, 500);

    const byStaff: Record<
      string,
      { total_actions: number; confirm_payments: number; close_requests: number; send_invoices: number }
    > = {};

    for (const row of data || []) {
      const staffId = row.staff_id as string;
      if (!byStaff[staffId]) {
        byStaff[staffId] = {
          total_actions: 0,
          confirm_payments: 0,
          close_requests: 0,
          send_invoices: 0,
        };
      }

      byStaff[staffId].total_actions += 1;
      if (row.action === "confirm_payment") byStaff[staffId].confirm_payments += 1;
      if (row.action === "close_request") byStaff[staffId].close_requests += 1;
      if (row.action === "send_invoice") byStaff[staffId].send_invoices += 1;
    }

    return apiSuccess({ since, by_staff: byStaff });
  });
}
