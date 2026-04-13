"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";
import { resetPasswordForEmail } from "@/lib/auth/admin-auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const result = await resetPasswordForEmail(data.email);

      if (!result.success) {
        toast.error(result.error || "Failed to send reset email");
        setIsLoading(false);
        return;
      }

      toast.success(`Password reset link sent to ${data.email}`);
      setSentEmail(data.email);
      setEmailSent(true);
      setIsLoading(false);
    } catch {
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground text-sm">
          Check your email ({sentEmail}) for the password reset link.
        </p>
        <Link
          href="/login"
          className="block text-center text-muted-foreground text-sm hover:text-foreground"
        >
          Back to login
        </Link>
      </div>
    );
  }

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

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading || !isValid}
      >
        {isLoading ? "Sending..." : "Send reset link"}
      </Button>

      <Link
        href="/auth/login"
        className="block text-center text-muted-foreground text-sm hover:text-foreground"
      >
        Back to login
      </Link>
    </form>
  );
}
