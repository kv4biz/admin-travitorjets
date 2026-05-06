//src/components/auth/AuthLayout.tsx
"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { content } from "@/lib/content/index";
import { themeManager } from "@/lib/theme";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const toggleTheme = () => themeManager.toggle();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x">
      {/* LEFT */}
      <div className="flex h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-lg px-10 py-14 sm:rounded-xl sm:border shadow-sm">
          {/* LOGO + THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="mx-auto flex size-16 items-center justify-center rounded-full ring-2 ring-muted cursor-pointer hover:ring-primary/50 transition-all"
            aria-label="Toggle theme"
          >
            <Image src="/logo-black.svg" alt="TraviatorJets" width={40} height={40} className="block dark:hidden" />
            <Image src="/logo-white.svg" alt="TraviatorJets" width={40} height={40} className="hidden dark:block" />
          </button>

          <h1 className="mt-3 text-center font-semibold text-2xl">{title}</h1>

          {subtitle && <p className="mt-2 text-center text-muted-foreground text-sm">{subtitle}</p>}

          <div className="mt-10">{children}</div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/50 dark:bg-muted/30">
        <Image
          alt="TraviatorJets Admin"
          className="absolute inset-0 size-full object-cover"
          src="/images/background-auth.png"
          width={1920}
          height={1080}
        />

        <div className="absolute inset-x-0 bottom-8 flex justify-center px-6">
          <Card className="w-full max-w-sm border-white/20 bg-white/10 backdrop-blur-md dark:border-white/10 dark:bg-black/20">
            <CardContent className="py-4 text-center">
              <p className="text-sm font-medium text-foreground/90">{content.auth.poweredBy.text}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
