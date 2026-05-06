// src/components/dashboard/requests/RequestHeader.tsx
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { content } from "@/lib/content";
import { RequestDetailsDialog } from "./RequestDetailsDialog";

type RequestHeaderProps = {
  request: {
    id: string;
    type: string;
    status: string;
    created_at: string;
    details: Record<string, unknown>;
    user: {
      full_name: string | null;
      username: string | null;
    } | null;
  };
  isAssigned: boolean;
  onClose?: () => void;
  onDetailsUpdated: (newDetails: Record<string, unknown>) => void;
};

function getDisplayId(req: RequestHeaderProps["request"]): string {
  const short = req.id.slice(0, 8).toUpperCase();
  if (req.type === "empty_leg_inquiry") return `#EL-${short}`;
  if (req.type === "charter") return `#CH-${short}`;
  if (req.type === "aircraft_inquiry") return `#AC-${short}`;
  return `#${short}`;
}

export function RequestHeader({ request, isAssigned, onClose, onDetailsUpdated }: RequestHeaderProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const handleClose = async () => {
    setConfirmClose(false);
    try {
      const res = await fetch(`/api/requests/${request.id}/close`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Request closed");
        onClose?.();
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to close");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const displayType = request.type.replace(/_/g, " ");
  const userName = request.user?.full_name || request.user?.username || "Unknown";

  const ct = content.pages.requestDetail;

  return (
    <>
      {/* Header – same layout for both desktop & mobile */}
      <div className="flex items-center justify-between gap-2 border-b px-4 py-1 lg:py-2 bg-muted/30">
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-lg font-semibold truncate">
            {getDisplayId(request)} - {userName}
          </h1>
          {/* Desktop: type · user · time */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <span className="capitalize">{displayType}</span>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(request.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="capitalize text-xs">
            {request.status}
          </Badge>

          {/* Three‑dot dropdown for all screens */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailsOpen(true)}>{ct.header.viewDetails}</DropdownMenuItem>
              {isAssigned && request.status !== "closed" && (
                <DropdownMenuItem onClick={() => setConfirmClose(true)}>{ct.header.closeRequest}</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Details Dialog */}
      <RequestDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        requestId={request.id}
        requestType={request.type}
        details={request.details}
        onDetailsUpdated={onDetailsUpdated}
      />

      {/* Confirm Close Dialog */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ct.closeConfirmation.title}</DialogTitle>
            <DialogDescription>{ct.closeConfirmation.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClose(false)}>
              {ct.closeConfirmation.cancel}
            </Button>
            <Button variant="destructive" onClick={handleClose}>
              {ct.closeConfirmation.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
