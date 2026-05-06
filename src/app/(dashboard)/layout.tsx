// src/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/client";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkAccess() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("onboarding_completed, role").eq("id", data.session.user.id).single();

      // Not completed onboarding and not already on onboarding page
      if (!profile?.onboarding_completed && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
      // Ensure staff/manager roles only (optional)
      setAuthorized(true);
    }
    checkAccess();
  }, [supabase, router, pathname]);

  if (!authorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="h-screen flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 min-h-0 overflow-hidden ">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
