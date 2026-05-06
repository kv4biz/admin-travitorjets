// src/components/dashboard/requests/UnassignedList.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { content } from "@/lib/content";
import { Loader2 } from "lucide-react";

type UnassignedRequest = {
  id: string;
  type: string;
  created_at: string;
  details: Record<string, unknown> | null;
  user: {
    full_name: string | null;
    username: string | null;
  } | null;
};

/** Build a display ID depending on request type, with consistent prefixes */
function getDisplayId(req: UnassignedRequest): string {
  const prefixMap: Record<string, string> = {
    empty_leg_inquiry: "EL",
    charter: "CH",
    aircraft_inquiry: "AC",
  };

  const prefix = prefixMap[req.type] || "";
  const baseId = req.type === "empty_leg_inquiry" && typeof req.details?.source_request_id === "string" ? req.details.source_request_id : req.id;

  const shortId = baseId.slice(0, 8).toUpperCase();

  return prefix ? `#${prefix}-${shortId}` : `#${shortId}`;
}
interface UnassignedListProps {
  onClaim?: (id: string) => void;
  refreshKey?: number;
}

export function UnassignedList({ onClaim, refreshKey }: UnassignedListProps) {
  const [requests, setRequests] = useState<UnassignedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests/unassigned?limit=50");
      const json = await res.json();
      setRequests(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshKey]);

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    try {
      const res = await fetch(`/api/requests/${id}/claim`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Request claimed");
        onClaim?.(id);
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        const json = await res.json();
        toast.error(json.error || "Failed to claim");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {content.pages.requests?.unassigned?.empty ?? "No unassigned requests"}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-2 lg:p-4">
        {requests.map((req) => (
          <Card key={req.id}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                {/* Left column */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-muted-foreground truncate">{getDisplayId(req)}</p>
                  <p className="text-sm font-medium truncate">{req.user?.full_name || req.user?.username || "Unknown"}</p>
                </div>

                {/* Middle column */}
                <div className="flex flex-col items-start gap-1 shrink-0">
                  {/* ✅ ALWAYS GHOST */}
                  <Badge variant="outline">{req.type.replace(/_/g, " ")}</Badge>

                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(req.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                {/* Right column */}
                <div className="shrink-0">
                  <Button variant="default" size="sm" onClick={() => handleClaim(req.id)} disabled={claimingId === req.id} className="gap-1">
                    {claimingId === req.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {claimingId === req.id ? "Claiming…" : (content.pages.requests?.unassigned?.claim ?? "Claim")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
