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
      let query = supabase.from("requests").select("*, user:user_id(full_name)").order("updated_at", { ascending: false }).limit(limit);

      if (profile.role === "user") {
        query = query.eq("user_id", profile.id);
      } else {
        query = query.eq("assigned_staff_id", profile.id).neq("status", "closed");
      }

      const { data: reqs, error } = await query;
      if (error) throw error;

      if (!reqs || reqs.length === 0) {
        setRequests([]);
        return;
      }

      const requestIds = reqs.map((r) => r.id);

      // Unread counts
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

      // Last message per request
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

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Real-time subscription for staff/manager
  useEffect(() => {
    if (!profile || profile.role === "user") return;

    const channel = supabase
      .channel(`assigned-${profile.id}-${channelId}`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, channelId, supabase, fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}
