// src/hooks/useRequests.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

export type Request = {
  id: string;
  type: string;
  status: string;
  details: Record<string, unknown>; // instead of any
  created_at: string;
  user_id: string;
  user?: { full_name: string };
};

type Profile = {
  id: string;
  role: "staff" | "manager" | "user";
};

export function useRequests(
  profile: Profile | null,
  limit: number = 10,
  assignedOnly: boolean = false,
) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchRequests = async () => {
      const supabase = createClient();
      let query = supabase
        .from("requests")
        .select("*, user:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (assignedOnly && profile.role === "staff") {
        query = query.eq("assigned_staff_id", profile.id);
      }

      const { data, error } = await query;
      if (!error) {
        setRequests(data as Request[]);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [profile, limit, assignedOnly]);

  return { requests, loading };
}
