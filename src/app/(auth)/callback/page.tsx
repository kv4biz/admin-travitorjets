// src/app/(auth)/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { Spinner } from "@/components/ui/spinner";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (!accessToken || !refreshToken) {
        router.replace("/login?error=invalid_callback");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        router.replace("/login?error=callback_failed");
        return;
      }

      if (type === "invite") {
        router.replace("/onboarding");
        return;
      }
      if (type === "recovery") {
        router.replace("/reset-password");
        return;
      }
      router.replace("/dashboard");
    }

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner className="h-8 w-8" />
      <span className="ml-3 text-muted-foreground">Signing you in…</span>
    </div>
  );
}
