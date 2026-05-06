//src/components/dashboard/top-bar.tsx
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Sun, Moon, LogOut, Settings, User } from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { createClient } from "@/lib/client";
import { themeManager } from "@/lib/theme";
import { content } from "@/lib/content";

export function TopBar() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const router = useRouter();

  const supabase = createClient();

  function getPageTitle(pathname: string) {
    const routes = content.dashboard.topBar.routes;

    // Exact match first
    if (routes[pathname]) return routes[pathname];

    // Dynamic route handling
    for (const route in routes) {
      if (route.includes("[id]")) {
        const baseRoute = route.replace("/[id]", "");
        if (pathname.startsWith(baseRoute + "/")) {
          return routes[route];
        }
      }
    }

    return "Dashboard";
  }

  const pageTitle = getPageTitle(pathname);
  const menuItems = content.dashboard.topBar.profileMenu;

  const isManager = profile?.role === "manager";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNavigation = (href: string | null, key: string) => {
    if (key === "logout") {
      handleLogout();
      return;
    }

    if (href) router.push(href);
  };

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "A";

  const isDark = () => typeof window !== "undefined" && document.documentElement.classList.contains("dark");

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        <div className="flex flex-col">
          <h1 className="text-lg font-semibold leading-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2">
        {/* THEME SWITCHER */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {isDark() ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={themeManager.setLight}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>

            <DropdownMenuItem onClick={themeManager.setDark}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* USER MENU (NOW ROLE + HREF BASED) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {menuItems.map((item) => {
              if (item.managerOnly && !isManager) return null;

              const Icon = item.key === "profile" ? User : item.key === "settings" ? Settings : LogOut;

              return (
                <DropdownMenuItem
                  key={item.key}
                  onClick={() => handleNavigation(item.href, item.key)}
                  className={item.key === "logout" ? "text-destructive" : ""}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
