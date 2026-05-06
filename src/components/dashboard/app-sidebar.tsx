// src/components/dashboard/app-sidebar.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { content } from "@/lib/content";
import { useProfile } from "@/hooks/useProfile";
import { useRequests } from "@/hooks/useRequests";
import {
  LayoutDashboard,
  FileText,
  Plane,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Folder,
  Users,
  BarChart,
  Settings,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavRequests } from "./nav-requests";
import { NavUser } from "./nav-user";

const iconMap = {
  LayoutDashboard,
  FileText,
  Plane,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Folder,
  Users,
  BarChart,
  Settings,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile } = useProfile();
  const { requests, loading } = useRequests(profile, 4);

  const isManager = profile?.role === "manager";

  const links = content.dashboard.sidebar.mainLinks.filter(
    (link) => !link.managerOnly || isManager,
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Static block – no click/hover */}
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent active:bg-transparent cursor-default data-[state=open]:bg-transparent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                <Image
                  src={content.dashboard.sidebar.header.logo}
                  alt="Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              {/* Hide this div when collapsed */}
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {content.dashboard.sidebar.header.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Premium Aviation
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain links={links} iconMap={iconMap} />
        <NavRequests
          requests={requests}
          loading={loading}
          content={content.dashboard.sidebar}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser profile={profile} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
