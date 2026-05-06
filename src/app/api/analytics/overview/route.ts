/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/analytics/overview/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (user, supabase) => {
    const now = new Date().toISOString();

    // Assigned to current user (active)
    const { count: assigned } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("assigned_staff_id", user.id)
      .neq("status", "closed");

    // Open & unassigned
    const { count: unassigned } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .is("assigned_staff_id", null)
      .eq("status", "open");

    // Upcoming admin empty legs
    const { count: adminEmptyLegs } = await supabase
      .from("empty_legs")
      .select("id", { count: "exact", head: true })
      .eq("source", "admin")
      .gte("departure_time", now);

    // Upcoming pexjet empty legs
    const { count: pexjetEmptyLegs } = await supabase
      .from("empty_legs")
      .select("id", { count: "exact", head: true })
      .eq("source", "pexjet")
      .gte("departure_time", now);

    // Pending invoices created by this admin
    const { count: pendingInvoices } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .eq("created_by", user.id);

    // Paid & confirmed invoices created by this admin
    const { count: paidInvoices } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["paid", "confirmed"])
      .eq("created_by", user.id);

    return apiSuccess({
      assigned: assigned ?? 0,
      unassigned: unassigned ?? 0,
      adminEmptyLegs: adminEmptyLegs ?? 0,
      pexjetEmptyLegs: pexjetEmptyLegs ?? 0,
      pendingInvoices: pendingInvoices ?? 0,
      paidInvoices: paidInvoices ?? 0,
    });
  });
}
