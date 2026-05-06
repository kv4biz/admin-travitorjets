/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/requests/assigned/route.ts
import { NextRequest } from "next/server";
import { withAdminAuth, apiSuccess, apiError, getPagination } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (user, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);
    const statusFilter = searchParams.get("status"); // optional "closed"

    let query = supabase.from("requests").select("*, user:user_id(id, full_name, username)", { count: "exact" }).eq("assigned_staff_id", user.id);

    if (statusFilter === "closed") {
      query = query.eq("status", "closed");
    } else {
      query = query.neq("status", "closed"); // default: active
    }

    const { data: assignedReqs, error, count } = await query.order("updated_at", { ascending: false }).range(from, to);

    if (error) return apiError(error.message, 500);
    if (!assignedReqs || assignedReqs.length === 0) {
      return apiSuccess([], { page, limit, total: 0 });
    }

    // Enrich with last message and unread count (same as before)
    const requestIds = assignedReqs.map((r) => r.id);

    const { data: lastMessages } = await supabase
      .from("messages")
      .select("request_id, content, created_at")
      .in("request_id", requestIds)
      .order("created_at", { ascending: false });

    const { data: unreadCounts } = await supabase
      .from("messages")
      .select("request_id")
      .in("request_id", requestIds)
      .eq("read", false)
      .neq("sender_id", user.id);

    const lastMsgMap = new Map<string, { content: string; created_at: string }>();
    if (lastMessages) {
      const grouped: Record<string, any[]> = {};
      for (const msg of lastMessages) {
        grouped[msg.request_id] = grouped[msg.request_id] || [];
        grouped[msg.request_id].push(msg);
      }
      for (const reqId of requestIds) {
        const msgs = grouped[reqId] || [];
        if (msgs.length > 0) {
          const latest = msgs[0];
          lastMsgMap.set(reqId, {
            content: latest.content,
            created_at: latest.created_at,
          });
        }
      }
    }

    const unreadCountMap = new Map<string, number>();
    if (unreadCounts) {
      for (const item of unreadCounts) {
        unreadCountMap.set(item.request_id, (unreadCountMap.get(item.request_id) || 0) + 1);
      }
    }

    const enriched = assignedReqs.map((req) => ({
      ...req,
      last_message: lastMsgMap.get(req.id) ?? null,
      unread_count: unreadCountMap.get(req.id) ?? 0,
    }));

    return apiSuccess(enriched, { page, limit, total: count || 0 });
  });
}
