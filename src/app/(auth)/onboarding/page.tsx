/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(auth)/onboarding/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

const onboardingSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(1, "Full name is required"),
  username: z
    .string()
    .min(3, "Username must be 3-20 characters")
    .max(20, "Username must be 3-20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
  phone: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const requestRef = useRef(0); // ✅ FIX: prevent race condition

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      password: "",
      full_name: "",
      username: "",
      phone: "",
    },
  });

  const watchedUsername = watch("username");

  /* ---------------- USERNAME CHECK ---------------- */
  useEffect(() => {
    if (!watchedUsername || watchedUsername.length < 3) {
      setUsernameStatus("idle");
      clearErrors("username");
      return;
    }

    const requestId = ++requestRef.current;

    const checkUsername = async () => {
      setUsernameStatus("checking");

      const { data, error } = await supabase.from("profiles").select("username").eq("username", watchedUsername).maybeSingle();

      // ✅ Ignore outdated responses
      if (requestId !== requestRef.current) return;

      if (error) {
        setUsernameStatus("idle");
        return;
      }

      if (data) {
        setUsernameStatus("taken");
        setError("username", {
          type: "manual",
          message: "Username is already taken",
        });
      } else {
        setUsernameStatus("available");
        clearErrors("username");
      }
    };

    const handler = setTimeout(checkUsername, 500);
    return () => clearTimeout(handler);
  }, [watchedUsername, supabase, setError, clearErrors]);

  /* ---------------- SESSION CHECK ---------------- */
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setUserEmail(data.session.user.email ?? "");

      const { data: profile } = await supabase.from("profiles").select("onboarding_completed").eq("id", data.session.user.id).single();

      if (profile?.onboarding_completed) {
        router.replace("/");
      } else {
        setLoading(false);
      }
    }

    checkSession();
  }, [supabase, router]);

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data: OnboardingFormData) => {
    setSubmitting(true);

    try {
      const { error: pwError } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (pwError) throw pwError;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          username: data.username,
          phone: data.phone ?? null,
          onboarding_completed: true,
        })
        .eq("id", user?.id);

      if (profileError) throw profileError;

      toast.success("Account ready!");
      router.replace("/");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <AuthLayout title="Loading..." subtitle="">
        <div className="flex justify-center p-8">
          <Spinner />
        </div>
      </AuthLayout>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <AuthLayout title="Complete your account" subtitle="Set your password and profile details">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={userEmail} disabled className="bg-muted" />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" placeholder="••••••••" {...register("password")} disabled={submitting} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" placeholder="John Doe" {...register("full_name")} disabled={submitting} />
          <FieldError>{errors.full_name?.message}</FieldError>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="john_doe" {...register("username")} disabled={submitting} />

          {usernameStatus === "checking" && <p className="text-xs text-muted-foreground">Checking...</p>}

          {usernameStatus === "available" && <p className="text-xs text-green-600">Username is available</p>}

          {/* ✅ ONLY ONE error source */}
          <FieldError>{errors.username?.message}</FieldError>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" placeholder="+1234567890" {...register("phone")} disabled={submitting} />
        </div>

        <Button type="submit" className="w-full" disabled={submitting || usernameStatus === "taken" || usernameStatus === "checking"}>
          {submitting ? "Saving…" : "Complete Setup"}
        </Button>
      </form>
    </AuthLayout>
  );
}
