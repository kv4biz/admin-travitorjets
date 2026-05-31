/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(dashboard)/requests/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/client";
import { RequestHeader } from "@/components/dashboard/requests/RequestHeader";
import { MessageInput } from "@/components/dashboard/requests/MessageInput";
import { MessageList } from "@/components/dashboard/requests/MessageList";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

type RequestDetail = {
  id: string;
  type: string;
  status: string;
  created_at: string;
  assigned_staff_id: string | null;
  details: Record<string, unknown>;
  user: { full_name: string | null; username: string | null } | null;
  invoice?: any;
};

interface Message {
  id: string;
  content: string;
  attachment_urls: string[] | null;
  sender_id: string;
  read: boolean;
  message_type: "user" | "system";
  created_at: string;
  sender: { full_name: string | null; username: string | null; avatar_url?: string | null } | null;
}

export default function RequestDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const supabase = createClient();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // ---------- Initial fetch ----------
  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);

        const res = await fetch(`/api/requests/${id}`);
        const json = await res.json();
        if (!res.ok) {
          setRequest(null);
        } else {
          setRequest(json.data);
          const msgRes = await fetch(`/api/requests/${id}/messages`);
          const msgJson = await msgRes.json();
          setMessages(msgJson.data || []);
        }
      } catch (err) {
        setRequest(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, supabase]);

  // ---------- Real‑time subscription ----------
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${id}`,
        },
        async (payload) => {
          const { data: fullMsg } = await supabase
            .from("messages")
            .select("*, sender:sender_id(id, full_name, username, avatar_url)")
            .eq("id", payload.new.id)
            .single();

          if (fullMsg) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === fullMsg.id)) return prev;
              return [...prev, fullMsg as Message];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  // ---------- Send message ----------
  const handleSend = async (content: string, attachmentUrls: string[]) => {
    if (!id) return;
    const res = await fetch(`/api/requests/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content || "(attachment)",
        attachment_urls: attachmentUrls,
      }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Failed to send");
    }
  };

  const handleDetailsUpdated = (newDetails: Record<string, unknown>) => {
    if (request) setRequest({ ...request, details: newDetails });
  };

  if (loading) {
    return (
      <div className="p-4">
        <Skeleton className="h-12 w-full rounded-xl mb-4" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!request) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Request not found</EmptyTitle>
          <EmptyDescription>The request you are looking for does not exist or has been removed.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const isAssigned = request.assigned_staff_id === currentUserId;

  return (
    <div className="h-full flex flex-col">
      <RequestHeader request={request} isAssigned={isAssigned} onClose={() => window.location.reload()} onDetailsUpdated={handleDetailsUpdated} />

      {/* Chat messages */}
      <MessageList messages={messages} currentUserId={currentUserId!} />

      {/* Message input */}
      {isAssigned && request.status !== "closed" && <MessageInput requestId={id!} onSend={handleSend} disabled={false} />}
    </div>
  );
}
