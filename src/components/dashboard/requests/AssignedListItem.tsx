//src/components/dashboard/requests/AssignedListItem.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { type Request } from "@/hooks/useRequests";

interface AssignedListItemProps {
  request: Request;
  onClose?: () => void;
  isArchived?: boolean;
}

/** Build a display ID with type prefix (consistent with sidebar & unassigned) */
function getDisplayId(req: Request): string {
  // For empty leg, prefer the original source ID
  if (req.type === "empty_leg_inquiry" && req.details?.source_request_id && typeof req.details.source_request_id === "string") {
    return `#EL-${req.details.source_request_id.slice(0, 8).toUpperCase()}`;
  }

  const shortId = req.id.slice(0, 8).toUpperCase();
  switch (req.type) {
    case "empty_leg_inquiry":
      return `#EL-${shortId}`;
    case "charter":
      return `#CH-${shortId}`;
    case "aircraft_inquiry":
      return `#AC-${shortId}`;
    default:
      return `#${shortId}`;
  }
}

export function AssignedListItem({ request, onClose, isArchived = false }: AssignedListItemProps) {
  const router = useRouter();

  const initials =
    request.user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const res = await fetch(`/api/requests/${request.id}/close`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Request closed");
        onClose?.();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to close request");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const displayId = getDisplayId(request);

  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted/50 transition-colors">
      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        {/* NAME + ID AS LINK */}
        <button onClick={() => router.push(`/requests/${request.id}`)} className="text-sm font-medium truncate text-left hover:underline">
          {request.user?.full_name || "Unknown"} - {displayId}
        </button>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">{request.last_message?.content || "No messages yet"}</p>

          {request.unread_count > 0 && (
            <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0">
              {request.unread_count}
            </Badge>
          )}
        </div>
      </div>

      {/* Right side: timestamp + menu */}
      <div className="flex items-center gap-1 shrink-0 self-start">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {request.last_message?.created_at
            ? formatDistanceToNow(new Date(request.last_message.created_at), {
                addSuffix: true,
              })
            : formatDistanceToNow(new Date(request.created_at), {
                addSuffix: true,
              })}
        </span>

        {!isArchived && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClose}>Close Request</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
