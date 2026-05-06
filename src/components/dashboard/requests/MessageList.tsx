// src/components/dashboard/requests/MessageList.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";

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

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolledRef = useRef(false);
  const [userScrolling, setUserScrolling] = useState(false);

  /* ---------------- DETECT USER SCROLL ---------------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setUserScrolling(!nearBottom);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------------- SMART SCROLL ---------------- */
  useEffect(() => {
    hasAutoScrolledRef.current = false;
  }, [messages.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || userScrolling || hasAutoScrolledRef.current) return;

    const firstUnread = messages.find((m) => !m.read && m.sender_id !== currentUserId);

    if (firstUnread) {
      const el = document.getElementById(`msg-${firstUnread.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    hasAutoScrolledRef.current = true;
  }, [messages, currentUserId, userScrolling]);

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div ref={containerRef} className="p-4 space-y-1">
        {messages.map((msg) => (
          <div key={msg.id} id={`msg-${msg.id}`}>
            <MessageBubble message={msg} currentUserId={currentUserId} />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
