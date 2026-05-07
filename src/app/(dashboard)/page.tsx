import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InvoicesChart } from "@/components/dashboard/charts/invoices-chart";
import { content } from "@/lib/content";

// ---------- Skeleton fallbacks ----------
// Two‑row skeleton for stat cards (matches the real content)
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent className="space-y-2 px-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function InvoicesCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent className="space-y-2 px-2">
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

function RequestListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

function StaffListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ---------- Widgets ----------
async function StatsCards() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date().toISOString();

  const { count: assigned } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .eq("assigned_staff_id", user.id)
    .neq("status", "closed");

  const { count: unassigned } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .is("assigned_staff_id", null)
    .eq("status", "open");

  const { count: adminEmptyLegs } = await supabase
    .from("empty_legs")
    .select("id", { count: "exact", head: true })
    .eq("source", "admin")
    .gte("departure_time", now);

  const { count: pexjetEmptyLegs } = await supabase
    .from("empty_legs")
    .select("id", { count: "exact", head: true })
    .eq("source", "pexjet")
    .gte("departure_time", now);

  // Pending invoices created by this admin
  const { count: pendingInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .eq("created_by", user.id);

  // Paid & confirmed invoices created by this admin
  const { count: paidInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .in("status", ["paid", "confirmed"])
    .eq("created_by", user.id);

  const stats = {
    assigned: assigned ?? 0,
    unassigned: unassigned ?? 0,
    adminEmptyLegs: adminEmptyLegs ?? 0,
    pexjetEmptyLegs: pexjetEmptyLegs ?? 0,
    pendingInvoices: pendingInvoices ?? 0,
    paidInvoices: paidInvoices ?? 0,
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{content.pages.overview.cards.requests.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{content.pages.overview.cards.requests.assigned}</span>
            <span className="text-2xl font-bold">{stats.assigned}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{content.pages.overview.cards.requests.unassigned}</span>
            <span className="text-2xl font-bold">{stats.unassigned}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{content.pages.overview.cards.emptyLegs.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{content.pages.overview.cards.emptyLegs.admin}</span>
            <span className="text-2xl font-bold">{stats.adminEmptyLegs}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{content.pages.overview.cards.emptyLegs.pexjet}</span>
            <span className="text-2xl font-bold">{stats.pexjetEmptyLegs}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{content.pages.overview.cards.invoices.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center gap-4 flex-wrap -mt-6">
            <div className="flex-1 min-w-[120px] space-y-2 px-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{content.pages.overview.cards.invoices.pending}</span>
                <span className="text-2xl font-bold">{stats.pendingInvoices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{content.pages.overview.cards.invoices.paid}</span>
                <span className="text-2xl font-bold">{stats.paidInvoices}</span>
              </div>
            </div>
            <div className="flex-1">
              <InvoicesChart pending={stats.pendingInvoices} paid={stats.paidInvoices} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

async function RecentRequestsList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: requests } = await supabase
    .from("requests")
    .select("*, user:user_id(full_name, username)")
    .eq("assigned_staff_id", user.id)
    .neq("status", "closed")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (!requests || requests.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No recent assigned requests.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/requests">View All Requests</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 px-2 p-2">
          {requests.map((req) => {
            const initials =
              req.user?.full_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "??";
            const displayId = (() => {
              if (req.type === "empty_leg_inquiry" && req.details?.source_request_id)
                return `#EL-${String(req.details.source_request_id).slice(0, 8).toUpperCase()}`;
              const short = req.id.slice(0, 8).toUpperCase();
              switch (req.type) {
                case "charter":
                  return `#CH-${short}`;
                case "aircraft_inquiry":
                  return `#AC-${short}`;
                default:
                  return `#${short}`;
              }
            })();

            return (
              <Link
                key={req.id}
                href={`/dashboard/requests/${req.id}`}
                className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{req.user?.full_name || "Unknown"}</span>
                    <span className="text-xs font-mono text-muted-foreground">{displayId}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">
                      {req.type.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{req.status}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(req.updated_at).toLocaleDateString()}</div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
      <div className="p-2 border-t">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/dashboard/requests">View All Requests</Link>
        </Button>
      </div>
    </div>
  );
}

async function StaffList() {
  const supabase = await createClient();

  // Fetch profiles directly (always works)
  const { data: staffProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("role", ["staff", "manager"])
    .order("full_name", { ascending: true });

  if (!staffProfiles || staffProfiles.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">{content.pages.overview.staffList.noData}</div>;
  }

  // Enrich with emails if possible
  let staffWithEmail = staffProfiles.map((p) => ({ ...p, email: null as string | null }));
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { createClient: createServiceClient } = await import("@supabase/supabase-js");
      const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { persistSession: false },
      });
      const userIds = staffProfiles.map((p) => p.id);
      const { data: authUsers } = await serviceClient.auth.admin.listUsers();
      if (authUsers?.users) {
        const emailMap = new Map(authUsers.users.filter((u) => userIds.includes(u.id)).map((u) => [u.id, u.email]));
        staffWithEmail = staffProfiles.map((p) => ({ ...p, email: emailMap.get(p.id) ?? null }));
      }
    }
  } catch (e) {
    console.error("Failed to enrich staff emails", e);
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 p-2">
          {staffWithEmail.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={member.avatar_url || ""} />
                <AvatarFallback>{member.full_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{member.email || "—"}</p>
              </div>
              <Badge variant="secondary" className="text-xs capitalize shrink-0">
                {member.role}
              </Badge>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-2 border-t">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/staffs">View All Staff</Link>
        </Button>
      </div>
    </div>
  );
}

// ---------- Main page ----------
export default async function AdminDashboardPage() {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="space-y-4 p-4 md:p-6">
        {/* Stats cards – show three skeleton cards while loading */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          <Suspense
            fallback={
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <InvoicesCardSkeleton />
              </>
            }
          >
            <StatsCards />
          </Suspense>
        </div>

        {/* Recent Requests + Staff */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 flex flex-col h-[500px]">
            <CardHeader>
              <CardTitle>{content.pages.overview.recentRequests.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <Suspense fallback={<RequestListSkeleton />}>
                <RecentRequestsList />
              </Suspense>
            </CardContent>
          </Card>
          <Card className="flex flex-col h-[500px]">
            <CardHeader>
              <CardTitle>{content.pages.overview.staffList.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <Suspense fallback={<StaffListSkeleton />}>
                <StaffList />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
