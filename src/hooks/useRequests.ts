//src/hooks/useRequests.ts
"use client";

import { useEffect, useState, useCallback, useId } from "react";
import { createClient } from "@/lib/client";
import { SupabaseClient } from "@supabase/supabase-js";

export type Request = {
  id: string;
  type: string;
  status: string;
  details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user_id: string;
  assigned_staff_id: string | null;
  user?: { full_name: string };
  unread_count: number;
  last_message?: { content: string; created_at: string } | null;
};

type Profile = {
  id: string;
  role: "staff" | "manager" | "user";
};

export function useRequests(profile: Profile | null, limit: number = 10) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState<SupabaseClient>(() => createClient());
  const channelId = useId();

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    try {
      // Always order by updated_at DESC (most recent activity first)
      let query = supabase.from("requests").select("*, user:user_id(full_name)").order("updated_at", { ascending: false }).limit(limit);

      if (profile.role === "user") {
        query = query.eq("user_id", profile.id);
      } else {
        // staff/manager – only assigned, not closed
        query = query.eq("assigned_staff_id", profile.id).neq("status", "closed");
      }

      const { data: reqs, error } = await query;
      if (error) throw error;

      if (!reqs || reqs.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const requestIds = reqs.map((r) => r.id);

      // Unread counts (messages where read = false and sender != current user)
      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("request_id")
        .in("request_id", requestIds)
        .eq("read", false)
        .neq("sender_id", profile.id);

      const unreadCountMap: Record<string, number> = {};
      if (unreadMessages) {
        for (const msg of unreadMessages) {
          unreadCountMap[msg.request_id] = (unreadCountMap[msg.request_id] || 0) + 1;
        }
      }

      // Last message per request (most recent)
      const { data: lastMessages } = await supabase
        .from("messages")
        .select("request_id, content, created_at")
        .in("request_id", requestIds)
        .order("created_at", { ascending: false });

      const lastMessageMap: Record<string, { content: string; created_at: string }> = {};
      if (lastMessages) {
        for (const msg of lastMessages) {
          if (!lastMessageMap[msg.request_id]) {
            lastMessageMap[msg.request_id] = {
              content: msg.content,
              created_at: msg.created_at,
            };
          }
        }
      }

      const enriched: Request[] = reqs.map((req) => ({
        ...req,
        unread_count: unreadCountMap[req.id] || 0,
        last_message: lastMessageMap[req.id] || null,
      }));

      setRequests(enriched);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [profile, limit, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ===== REAL‑TIME SUBSCRIPTION =====
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel(`admin-requests-${channelId}`)
      // Watch for changes on requests that belong to the current user (as assigned_staff)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `assigned_staff_id=eq.${profile.id}`,
        },
        () => {
          fetchRequests();
        },
      )
      // Also watch for new messages on any request (they affect unread count and last_message)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchRequests();
      })
      // Watch for read status updates (mark as read)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: "read=eq.true" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, profile, channelId, fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}
