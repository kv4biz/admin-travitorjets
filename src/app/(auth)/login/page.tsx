//src/app/(auth)/login/page.tsx
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect("/");
  }

  return (
    <AuthLayout title="Login to TraviatorJets" subtitle="Admin Dashboard">
      <LoginForm />
    </AuthLayout>
  );
}
