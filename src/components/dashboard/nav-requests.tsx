"use client";

import Link from "next/link";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export function NavRequests({ requests, loading, content }: NavRequestsProps) {
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
            <div className="px-2 py-2 text-xs text-muted-foreground">
              {content.noRequests}
            </div>
          ) : (
            <>
              {requests.map((req) => (
                <SidebarMenuItem key={req.id}>
                  <SidebarMenuButton asChild>
                    <Link href={`/dashboard/requests/${req.id}`}>
                      <span className="truncate">
                        {req.type.replace("_", " ")} #{req.id.slice(0, 8)}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {requests.length >= content.maxRequests && (
                <div className="mt-2 px-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="w-full justify-start"
                  >
                    <Link href="/dashboard/requests">{content.moreButton}</Link>
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
