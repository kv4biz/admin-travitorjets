//src/app/api/analytics/overview/route.ts
import { withManagerAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  return withManagerAuth(async (_, supabase) => {
    const { count: openRequests, error: openError } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "assigned", "confirmed"]);

    if (openError) return apiError(openError.message, 500);

    const { count: recentActivity, error: actError } = await supabase
      .from("admin_activities")
      .select("id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      );

    if (actError) return apiError(actError.message, 500);

    const { count: pendingPayments, error: pendingError } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent");

    if (pendingError) return apiError(pendingError.message, 500);

    return apiSuccess({
      open_requests: openRequests || 0,
      recent_activity: recentActivity || 0,
      pending_payments: pendingPayments || 0,
    });
  });
}
