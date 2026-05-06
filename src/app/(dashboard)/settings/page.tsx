/* eslint-disable react-hooks/set-state-in-effect */
//src/app/(dashboard)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LogOut, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { themeManager } from "@/lib/theme";
import { content } from "@/lib/content";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const handleToggleTheme = () => {
    themeManager.toggle();
    setIsDark(!isDark);
    toast.success(!isDark ? content.pages.settings.theme.switchedToDark : content.pages.settings.theme.switchedToLight);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace("/login");
      toast.success(content.pages.settings.logout.success);
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <div className="h-full p-4 md:p-6">
      <Card className="w-full h-full overflow-hidden flex flex-col">
        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Sidebar tabs - only one tab now */}
          <div className="border-b lg:border-b-0 lg:border-r lg:w-56 bg-muted/30 shrink-0">
            <div className="flex lg:hidden">
              <button className="flex-1 py-3 text-sm font-medium border-b-2 border-primary text-primary">{content.pages.settings.tab}</button>
            </div>

            <div className="hidden lg:flex flex-col p-4 gap-1">
              <button className="text-left px-3 py-2 rounded-md text-sm bg-background shadow-sm font-medium">{content.pages.settings.tab}</button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{content.pages.settings.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{content.pages.settings.subtitle}</p>
            </div>

            <div className="max-w-xl space-y-8">
              {/* Theme toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-amber-500" />}
                  <div>
                    <Label className="text-base font-medium">{content.pages.settings.theme.label}</Label>
                    <p className="text-sm text-muted-foreground">{content.pages.settings.theme.description}</p>
                  </div>
                </div>
                <Switch checked={isDark} onCheckedChange={handleToggleTheme} />
              </div>

              {/* Logout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-destructive" />
                  <div>
                    <Label className="text-base font-medium">{content.pages.settings.logout.label}</Label>
                    <p className="text-sm text-muted-foreground">{content.pages.settings.logout.description}</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleLogout}>
                  {content.pages.settings.logout.button}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
