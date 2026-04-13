"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FieldError } from "@/components/ui/field";
import { signInWithEmail } from "@/lib/auth/admin-auth";
import { loginSchema, type LoginFormData } from "@/lib/validations";

export function AdminLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await signInWithEmail({
        email: data.email,
        password: data.password,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to sign in");
        setIsLoading(false);
        return;
      }

      toast.success("Signed in successfully");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@traviatorjets.com"
          disabled={isLoading}
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          disabled={isLoading}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading || !isValid}
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
      {/* 
      <Link
        className="mt-6 block text-center text-muted-foreground text-sm hover:text-foreground"
        href="/forgot-password"
      >
        Forgot your password?
      </Link> */}
    </form>
  );
}
