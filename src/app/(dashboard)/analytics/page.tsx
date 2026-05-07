// src/app/(dashboard)/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BarChartRequests } from "@/components/dashboard/charts/bar-chart-requests";
import { PieChartTypes } from "@/components/dashboard/charts/pie-chart-types";
import { content } from "@/lib/content";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AnalyticsData = {
  totalUsers: number;
  totalAdmins: number;
  adminPerformance: {
    id: string;
    full_name: string;
    totalRequests: number;
    closedWithConfirmed: number;
    closedWithoutConfirmed: number;
  }[];
  monthlyRequests: { month: string; count: number }[];
  typeBreakdown: { type: string; count: number }[];
};

type SyncResult = {
  synced: number;
  skipped: number;
  failedCount: number;
  deletedOld: boolean;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // clear state
  const [clearing, setClearing] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Fetch analytics
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await fetch("/api/analytics/performance");
      const json = await res.json();
      setData(json.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Sync handler
  async function handleSync() {
    try {
      setSyncing(true);

      setSyncError(null);

      setSyncResult(null);

      const res = await fetch("/api/empty-legs/sync", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Sync failed");
      }

      setSyncResult(json.data);

      toast.success(content.pages.analytics.sync.syncSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";

      setSyncError(message);

      toast.error(content.pages.analytics.sync.syncFailed);
    } finally {
      setSyncing(false);
    }
  }

  // Clear handler
  async function handleClear() {
    try {
      setClearing(true);

      const res = await fetch("/api/empty-legs/clear", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Clear failed");
      }

      toast.success(content.pages.analytics.sync.clearSuccess);

      setSyncResult(null);

      setClearDialogOpen(false);
    } catch (error) {
      console.error(error);

      toast.error(content.pages.analytics.sync.clearFailed);
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const ct = content.pages.analytics;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 space-y-6">
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{ct.stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data?.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{ct.stats.totalAdmins}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{data?.totalAdmins}</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin performance */}
        <Card>
          <CardHeader>
            <CardTitle>{ct.adminPerformance.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">{ct.adminPerformance.name}</th>
                    <th className="text-right py-2 font-medium">{ct.adminPerformance.totalRequests}</th>
                    <th className="text-right py-2 font-medium">{ct.adminPerformance.closedWithInvoice}</th>
                    <th className="text-right py-2 font-medium">{ct.adminPerformance.closedWithoutInvoice}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.adminPerformance.map((admin) => (
                    <tr key={admin.id} className="border-b last:border-0">
                      <td className="py-2">{admin.full_name}</td>
                      <td className="text-right py-2">{admin.totalRequests}</td>
                      <td className="text-right py-2 text-green-600">{admin.closedWithConfirmed}</td>
                      <td className="text-right py-2 text-orange-600">{admin.closedWithoutConfirmed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{ct.monthlyRequests.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <BarChartRequests data={data?.monthlyRequests ?? []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{ct.typeBreakdown.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <PieChartTypes data={data?.typeBreakdown ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* Sync Card */}
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center justify-between">
              <span>{ct.sync.title}</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setClearDialogOpen(true)} disabled={clearing}>
                  {ct.sync.clearButton}
                </Button>
                <Button onClick={handleSync} disabled={syncing}>
                  {syncing ? ct.sync.syncing : ct.sync.syncButton}
                </Button>
              </div>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{ct.sync.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncing && <div className="rounded-lg border bg-background p-4 text-sm">{ct.sync.syncing}</div>}

            {syncError && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">{syncError}</div>}

            {syncResult && (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{ct.sync.synced}</p>
                  <p className="mt-2 text-2xl font-bold">{syncResult.synced}</p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{ct.sync.skipped}</p>
                  <p className="mt-2 text-2xl font-bold">{syncResult.skipped}</p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{ct.sync.failed}</p>
                  <p className="mt-2 text-2xl font-bold text-red-600">{syncResult.failedCount}</p>
                </div>
                <div className="rounded-xl border bg-background p-4">
                  <p className="text-sm text-muted-foreground">{ct.sync.oldDataCleanup}</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">{syncResult.deletedOld ? ct.sync.yes : ct.sync.no}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clear confirmation dialog */}
        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{ct.sync.clearButton}</DialogTitle>
              <DialogDescription>{ct.sync.clearConfirm}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClear} disabled={clearing}>
                {clearing ? "Clearing..." : ct.sync.clearButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
