//src/app/(auth)/invite/page.tsx
import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { InviteAcceptForm } from "@/components/auth/InviteAcceptForm";

function InviteContent() {
  return <InviteAcceptForm />;
}

export default function InvitePage() {
  return (
    <AuthLayout title="Accept Invitation" subtitle="Create your admin account">
      <Suspense
        fallback={
          <div className="text-center text-muted-foreground">Loading...</div>
        }
      >
        <InviteContent />
      </Suspense>
    </AuthLayout>
  );
}
