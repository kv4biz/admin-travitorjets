"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
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

export function AppSidebar() {
  const { profile } = useProfile();
  // FIX: pass profile as first argument, then limit = 4
  const { requests, loading } = useRequests(profile, 4);

  const isManager = profile?.role === "manager";

  const links = content.dashboard.sidebar.mainLinks.filter(
    (link) => !link.managerOnly || isManager,
  );

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b px-4 py-2">
        <span className="font-bold text-lg">
          {content.dashboard.sidebar.header.title}
        </span>
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
    </Sidebar>
  );
}
