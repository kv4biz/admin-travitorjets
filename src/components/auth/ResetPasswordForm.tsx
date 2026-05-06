//src/components/auth/ResetPasswordForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FieldError } from "@/components/ui/field";
import { updatePassword } from "@/lib/auth/admin-auth";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations";
import { content } from "@/lib/content";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const result = await updatePassword(data.password);
      if (!result.success) {
        toast.error(result.error || content.auth.toast.resetError);
        setIsLoading(false);
        return;
      }
      toast.success(content.auth.toast.resetSuccess);
      router.push("/login");
    } catch {
      toast.error(content.auth.toast.resetError);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">
          {content.auth.resetPassword.newPasswordLabel}
        </Label>
        <PasswordInput
          id="password"
          placeholder={content.auth.resetPassword.newPasswordPlaceholder}
          disabled={isLoading}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {content.auth.resetPassword.confirmPasswordLabel}
        </Label>
        <PasswordInput
          id="confirmPassword"
          placeholder={content.auth.resetPassword.confirmPasswordPlaceholder}
          disabled={isLoading}
          {...register("confirmPassword")}
        />
        <FieldError>{errors.confirmPassword?.message}</FieldError>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading || !isValid}
      >
        {isLoading ? "Resetting..." : content.auth.resetPassword.submitButton}
      </Button>
    </form>
  );
}
