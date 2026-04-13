import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/lib/auth/admin-auth";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Check if user has admin role (staff or manager)
  if (!profile || (profile.role !== "staff" && profile.role !== "manager")) {
    redirect("/login?error=unauthorized");
  }

  async function handleSignOut() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to TraviatorJets Admin
          </p>
        </div>
        <form action={handleSignOut}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-2 font-semibold text-lg">User Information</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{user.email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Role:</span>{" "}
              <span className="font-medium capitalize">
                {profile?.role || "N/A"}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{profile?.name || "N/A"}</span>
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-2 font-semibold text-lg">Quick Stats</h3>
          <p className="text-muted-foreground text-sm">
            Dashboard features coming soon...
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="mb-2 font-semibold text-lg">Recent Activity</h3>
          <p className="text-muted-foreground text-sm">
            Activity tracking coming soon...
          </p>
        </Card>
      </div>
    </div>
  );
}
