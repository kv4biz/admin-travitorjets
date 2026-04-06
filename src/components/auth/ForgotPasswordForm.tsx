"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordForEmail } from "@/lib/auth/admin-auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await resetPasswordForEmail(email);

      if (!result.success) {
        toast.error(result.error || "Failed to send reset email");
        setIsLoading(false);
        return;
      }

      toast.success(`Password reset link sent to ${email}`);
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
          Check your email for the password reset link.
        </p>
        <Link
          href="/auth/login"
          className="block text-center text-muted-foreground text-sm hover:text-foreground"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@traviatorjets.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
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
