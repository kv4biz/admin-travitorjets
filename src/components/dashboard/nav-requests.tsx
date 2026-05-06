// src/components/dashboard/nav-requests.tsx
"use client";

import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, MoreHorizontal } from "lucide-react";
import { type Request } from "@/hooks/useRequests";

interface NavRequestsProps {
  requests: Request[];
  loading: boolean;
  content: {
    requestsTitle: string;
    noRequests: string;
    maxRequests: number;
    moreButton: string;
  };
}

/** ✅ Format ID with a type prefix */
function getDisplayId(req: Request): string {
  const shortId = req.id.slice(0, 8).toUpperCase();

  switch (req.type) {
    case "empty_leg_inquiry":
      return `#EL-${shortId}`; // Empty Leg
    case "charter":
      return `#CH-${shortId}`; // Charter
    case "aircraft_inquiry":
      return `#AC-${shortId}`; // Aircraft Listing
    default:
      return shortId; // fallback (no prefix)
  }
}

/** ✅ Format full label */
function getDisplayLabel(req: Request): string {
  const id = getDisplayId(req);
  const name = req.user?.full_name || "Unknown";

  return `${id} - ${name}`;
}

export function NavRequests({ requests, loading, content }: NavRequestsProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const visibleRequests = requests.slice(0, 4);
  const hasMore = requests.length > 4;

  // ================= COLLAPSED =================
  if (isCollapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {loading ? (
              <div className="p-2 space-y-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ) : requests.length === 0 ? null : (
              <>
                {visibleRequests.map((req) => (
                  <SidebarMenuItem key={req.id}>
                    <SidebarMenuButton
                      asChild
                      tooltip={getDisplayLabel(req)} // ✅ clean tooltip
                    >
                      <Link href={`/requests/${req.id}`}>
                        <MessageCircle className="size-4" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                {hasMore && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="More requests">
                      <Link href="/requests">
                        <MoreHorizontal className="size-4" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // ================= EXPANDED =================
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{content.requestsTitle}</SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {loading ? (
            <div className="space-y-1 p-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">{content.noRequests}</div>
          ) : (
            <>
              {requests.map((req) => (
                <SidebarMenuItem key={req.id}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={`/requests/${req.id}`}
                      className="block w-full"
                      title={getDisplayLabel(req)} // ✅ hover full text
                    >
                      {/* ✅ truncation applied here */}
                      <span className="truncate block">{getDisplayLabel(req)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {requests.length >= content.maxRequests && (
                <div className="mt-2 px-2">
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link href="/requests">{content.moreButton}</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
