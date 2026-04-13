//src/app/(auth)/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const params = new URLSearchParams(
        hash.startsWith("#") ? hash.slice(1) : hash,
      );

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (!accessToken || !refreshToken) {
        console.error("Missing tokens in callback. Hash:", hash);
        router.replace("/login?error=invalid_callback");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("Failed to set session:", error);
        router.replace("/login?error=callback_failed");
        return;
      }

      if (type === "invite" || type === "recovery") {
        router.replace("/reset-password");
        return;
      }

      router.replace("/dashboard");
    }

    handleCallback();
  }, [router]);

  return (
    <div className="p-6 text-center text-muted-foreground">Signing you in…</div>
  );
}
