import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";

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
      <AdminLoginForm />
    </AuthLayout>
  );
}
