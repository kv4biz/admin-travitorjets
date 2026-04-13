"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

type NavLink = {
  href: string;
  label: string;
  icon: keyof typeof iconMapExample; // adjust based on your actual icon map
  managerOnly: boolean;
};

// Generic type for icon map – you can import the actual iconMap type from app-sidebar
type IconMap = Record<string, LucideIcon>;

interface NavMainProps {
  links: NavLink[];
  iconMap: IconMap;
}

export function NavMain({ links, iconMap }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map((link) => {
            const Icon = iconMap[link.icon];
            const isActive = pathname === link.href;

            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={link.label}
                >
                  <Link href={link.href}>
                    <Icon />
                    <span>{link.label}</span>
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

// Dummy type for the example – replace with actual icon names from your content
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const iconMapExample = {
  LayoutDashboard: null,
  FileText: null,
  Plane: null,
  ShoppingCart: null,
  CreditCard: null,
  DollarSign: null,
  Folder: null,
  Users: null,
  BarChart: null,
  Settings: null,
};
