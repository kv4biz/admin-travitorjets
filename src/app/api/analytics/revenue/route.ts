//src/app/api/analytics/revenue/route.ts
import { withManagerAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  return withManagerAuth(async (_, supabase) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("amount, currency_code, paid_at")
      .eq("status", "paid");

    if (error) return apiError(error.message, 500);

    const totalByCurrency: Record<string, number> = {};
    for (const row of data || []) {
      const currency = row.currency_code || "USD";
      const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
      totalByCurrency[currency] = (totalByCurrency[currency] || 0) + (Number.isFinite(amount) ? amount : 0);
    }

    return apiSuccess({ totals_by_currency: totalByCurrency, invoices_paid: (data || []).length });
  });
}
