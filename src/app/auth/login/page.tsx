import { AuthLayout } from "@/components/auth/AuthLayout"
import { AdminLoginForm } from "@/components/auth/AdminLoginForm"

export default function LoginPage() {
  return (
    <AuthLayout
      title="Login to TraviatorJets"
      subtitle="Admin Dashboard"
    >
      <AdminLoginForm />
    </AuthLayout>
  )
}
