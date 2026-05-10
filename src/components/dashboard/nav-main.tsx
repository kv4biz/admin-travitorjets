//src/components/dashboard/nav-main.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  LayoutDashboard,
  FileText,
  Plane,
  PlaneLanding,
  TicketsPlane,
  PlaneTakeoff,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Folder,
  Users,
  BarChart,
  Settings,
} from "lucide-react";

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

// ----------------------------
// ICON MAP (REAL IMPLEMENTATION)
// ----------------------------
const iconMap = {
  LayoutDashboard,
  FileText,
  Plane,
  PlaneLanding,
  TicketsPlane,
  PlaneTakeoff,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Folder,
  Users,
  BarChart,
  Settings,
} as const;

type IconName = keyof typeof iconMap;

type NavLink = {
  href: string;
  label: string;
  icon: IconName;
  managerOnly: boolean;
};

interface NavMainProps {
  links: NavLink[];
}

export function NavMain({ links }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map((link) => {
            const Icon: LucideIcon = iconMap[link.icon] || LayoutDashboard;

            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={link.label}>
                  <Link href={link.href}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
