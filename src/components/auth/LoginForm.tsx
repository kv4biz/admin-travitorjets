//src/components/auth/LoginForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { content } from "@/lib/content";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signInWithEmail(data);
      if (!result.success) {
        toast.error(result.error || content.auth.toast.loginError);
        setIsLoading(false);
        return;
      }
      toast.success(content.auth.toast.loginSuccess);
      router.push("/");
      router.refresh();
    } catch {
      toast.error(content.auth.toast.loginError);
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{content.auth.login.emailLabel}</Label>
        <Input
          id="email"
          type="email"
          placeholder={content.auth.login.emailPlaceholder}
          disabled={isLoading}
          {...register("email")}
        />
        <FieldError>{errors.email?.message}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{content.auth.login.passwordLabel}</Label>
        <PasswordInput
          id="password"
          placeholder={content.auth.login.passwordPlaceholder}
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
        {isLoading ? "Signing in..." : content.auth.login.submitButton}
      </Button>

      {/* Uncomment if forgot password is needed
      <Link
        href="/forgot-password"
        className="mt-6 block text-center text-muted-foreground text-sm hover:text-foreground"
      >
        {content.auth.login.forgotPasswordLink}
      </Link>
      */}
    </form>
  );
}
