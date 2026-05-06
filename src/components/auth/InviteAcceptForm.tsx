//src/components/auth/InviteAcceptForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { FieldError } from "@/components/ui/field";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations";
import { content } from "@/lib/content";

export function InviteAcceptForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [invitationValid, setInvitationValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");

    const validateInvitation = async () => {
      if (!tokenParam) {
        setError(content.auth.invite.errorInvalid);
        setIsLoading(false);
        return;
      }

      setToken(tokenParam);

      try {
        const response = await fetch(`/api/invitations/${tokenParam}`);
        const data = await response.json();
        if (!response.ok || !data.success) {
          setError(data.error || content.auth.invite.errorInvalid);
          setIsLoading(false);
          return;
        }
        setEmail(data.data.email);
        setInvitationValid(true);
        setIsLoading(false);
      } catch {
        setError(content.auth.invite.errorFailed);
        setIsLoading(false);
      }
    };

    validateInvitation();
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        toast.error(responseData.error || content.auth.toast.inviteError);
        setIsLoading(false);
        return;
      }
      toast.success(content.auth.toast.inviteSuccess);
      router.push("/login");
    } catch {
      toast.error(content.auth.toast.inviteError);
      setIsLoading(false);
    }
  };

  if (isLoading && !invitationValid) {
    return (
      <div className="text-center text-muted-foreground">
        {content.auth.invite.validating}
      </div>
    );
  }

  if (!invitationValid) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
        <Button
          onClick={() => router.push("/login")}
          variant="outline"
          className="w-full"
        >
          Go to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{content.auth.invite.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          value={email}
          disabled
          className="bg-muted"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{content.auth.invite.passwordLabel}</Label>
        <PasswordInput
          id="password"
          placeholder={content.auth.invite.passwordPlaceholder}
          disabled={isLoading}
          {...register("password")}
        />
        <FieldError>{errors.password?.message}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {content.auth.invite.confirmPasswordLabel}
        </Label>
        <PasswordInput
          id="confirmPassword"
          placeholder={content.auth.invite.confirmPasswordPlaceholder}
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
        {isLoading ? "Creating account..." : content.auth.invite.submitButton}
      </Button>
    </form>
  );
}
