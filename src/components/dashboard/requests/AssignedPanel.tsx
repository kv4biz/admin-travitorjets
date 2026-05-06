/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/dashboard/requests/AssignedPanel.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRequests } from "@/hooks/useRequests";
import { createClient } from "@/lib/client";
import { AssignedListItem } from "./AssignedListItem";

interface AssignedPanelProps {
  content: {
    active: string;
    archived: string;
    empty: string;
  };
}

type Profile = {
  id: string;
  role: "staff" | "manager" | "user";
};

export function AssignedPanel({ content }: AssignedPanelProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: profileData } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();

      setProfile({
        id: data.user.id,
        role: (profileData?.role as Profile["role"]) || "user",
      });
    }
    getProfile();
  }, [supabase]);

  const { requests: activeRequests, loading: activeLoading, refetch: refetchActive } = useRequests(profile, 50);

  const [archivedRequests, setArchived] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const fetchArchived = useCallback(async () => {
    if (!profile) return;
    setArchivedLoading(true);
    try {
      const res = await fetch(`/api/requests/assigned?status=closed&limit=50`);
      if (!res.ok) {
        console.error("❌ Failed to fetch archived requests");
        setArchived([]);
        return;
      }
      const json = await res.json();
      setArchived(json.data || []);
    } catch (err) {
      console.error("❌ Archived fetch error:", err);
      setArchived([]);
    } finally {
      setArchivedLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) fetchArchived();
  }, [profile, fetchArchived]);

  // Called when a request is closed → refresh both lists
  const handleClose = () => {
    refetchActive();
    fetchArchived();
  };

  return (
    <Tabs defaultValue="active" className="h-full flex flex-col">
      <div className="px-4 pt-4">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            {content.active}
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex-1">
            {content.archived}
          </TabsTrigger>
        </TabsList>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <TabsContent value="active" className="mt-0 px-2">
          {!profile || activeLoading ? (
            <p className="text-muted-foreground text-sm p-4">Loading…</p>
          ) : activeRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm p-4">{content.empty}</p>
          ) : (
            activeRequests.map((req) => <AssignedListItem key={req.id} request={req} onClose={handleClose} />)
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-0 px-2">
          {!profile || archivedLoading ? (
            <p className="text-muted-foreground text-sm p-4">Loading…</p>
          ) : archivedRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm p-4">No archived requests</p>
          ) : (
            archivedRequests.map((req: any) => <AssignedListItem key={req.id} request={req} isArchived />)
          )}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
