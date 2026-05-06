//src/components/dashboard/requests/MessageBubble.tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  FileText, // ✅ changed icon
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------- TYPES ---------------- */
interface Message {
  id: string;
  content: string;
  attachment_urls: string[] | null;
  sender_id: string;
  read: boolean;
  message_type: "user" | "system";
  created_at: string;
  sender: {
    full_name: string | null;
    username: string | null;
    avatar_url?: string | null;
  } | null;
}

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

/* ---------------- COMPONENT ---------------- */
export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isSystem = message.message_type === "system";
  const isOwn = message.sender_id === currentUserId;

  const attachments = message.attachment_urls ?? [];
  const [attIndex, setAttIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const current = attachments[attIndex];

  const fileName = (url: string) => url.split("/").pop() ?? "file";

  const isImage = (url: string) => /\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(url);

  /* ---------------- NAV ---------------- */
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttIndex((i) => Math.max(i - 1, 0));
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttIndex((i) => Math.min(i + 1, attachments.length - 1));
  };

  /* ---------------- CLICK HANDLER ---------------- */
  const handleAttachmentClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();

    if (isImage(url)) {
      setPreviewUrl(url);
    } else {
      // ✅ OPEN DOCUMENT IN NEW TAB (clean + safe)
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const closePreview = () => setPreviewUrl(null);

  /* ---------------- SYSTEM ---------------- */
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="bg-muted text-muted-foreground text-xs rounded-lg px-4 py-2 text-center w-[80%] sm:w-[60%]">
          {message.content}
          <div className="mt-1 opacity-70">
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- USER ---------------- */
  return (
    <>
      <div className={cn("flex mb-4", isOwn ? "justify-end" : "justify-start")}>
        <div className={cn("flex flex-col min-w-0 w-[80%] sm:w-[60%]", isOwn ? "items-end" : "items-start")}>
          {!isOwn && message.sender && (
            <p className="text-xs text-muted-foreground mb-1 px-1">{message.sender.full_name || message.sender.username || "Unknown"}</p>
          )}

          {/* BUBBLE */}
          <div className="rounded-2xl px-4 py-3 text-sm border bg-muted text-foreground w-full">
            {message.content && <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{message.content}</p>}

            {/* ATTACHMENTS */}
            {attachments.length > 0 && current && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  {attachments.length > 1 && (
                    <button onClick={prev} disabled={attIndex === 0} className="opacity-50 hover:opacity-100 shrink-0">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}

                  {/* FILE CARD */}
                  <div
                    onClick={(e) => handleAttachmentClick(e, current)}
                    className="flex items-center gap-3 bg-background border rounded-xl px-3 py-2 cursor-pointer flex-1 min-w-0 hover:bg-muted/70 transition"
                  >
                    {isImage(current) ? (
                      <img src={current} alt="attachment" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-lg shrink-0">
                        {/* ✅ FILE ICON (replaces download icon) */}
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    <span className="text-xs truncate">{fileName(current)}</span>
                  </div>

                  {attachments.length > 1 && (
                    <button onClick={next} disabled={attIndex === attachments.length - 1} className="opacity-50 hover:opacity-100 shrink-0">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {attachments.length > 1 && (
                  <p className="text-[10px] text-center mt-1 text-muted-foreground">
                    {attIndex + 1} / {attachments.length}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className={cn("flex items-center gap-1 mt-1 px-1", isOwn ? "justify-end" : "justify-start")}>
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
            </span>

            {isOwn && (message.read ? <CheckCheck className="h-3 w-3 text-muted-foreground" /> : <Check className="h-3 w-3 text-muted-foreground" />)}
          </div>
        </div>
      </div>

      {/* IMAGE PREVIEW */}
      {previewUrl &&
        createPortal(
          <div className="fixed inset-0 z-9999 bg-black/90 flex items-center justify-center" onClick={closePreview}>
            <button onClick={closePreview} className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
              <X className="h-6 w-6" />
            </button>

            <img src={previewUrl} alt="Preview" className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          </div>,
          document.body,
        )}
    </>
  );
}
