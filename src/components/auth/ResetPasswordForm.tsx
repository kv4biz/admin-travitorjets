/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/auth/ResetPasswordForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FieldError } from "@/components/ui/field";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations";
import { createClient } from "@/lib/client";
import { content } from "@/lib/content";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const supabase = createClient();

    // 1. Check if a session already exists (e.g., from hash fragment fallback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecoverySession(true);
        cleanUrl();
      }
    });

    // 2. Listen for auth changes – the PKCE exchange will trigger SIGNED_IN
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setIsRecoverySession(true);
        cleanUrl();
      }
    });

    // 3. Fallback timeout: if after 3 seconds we have no session, assume recovery failed
    const timeout = setTimeout(() => {
      if (!isRecoverySession) {
        const hasCode = new URL(window.location.href).searchParams.has("code");
        if (hasCode) {
          toast.error("Unable to verify reset link. Please request a new one.");
          router.push("/forgot-password");
        }
      }
    }, 3000);

    function cleanUrl() {
      // Remove the ?code=... from the URL to prevent confusion
      if (window.location.search.includes("code=")) {
        window.history.replaceState({}, "", "/reset-password");
      }
    }

    return () => {
      listener?.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, isRecoverySession]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      toast.success(content.auth.toast.resetSuccess);
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || content.auth.toast.resetError);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecoverySession) {
    return <div className="text-center text-sm text-muted-foreground">Verifying reset link...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{content.auth.resetPassword.newPasswordLabel}</Label>
        <PasswordInput id="password" placeholder={content.auth.resetPassword.newPasswordPlaceholder} disabled={isLoading} {...register("password")} />
        <FieldError>{errors.password?.message}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{content.auth.resetPassword.confirmPasswordLabel}</Label>
        <PasswordInput
          id="confirmPassword"
          placeholder={content.auth.resetPassword.confirmPasswordPlaceholder}
          disabled={isLoading}
          {...register("confirmPassword")}
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading || !isValid}>
        {isLoading ? "Resetting..." : content.auth.resetPassword.submitButton}
      </Button>
    </form>
  );
}
