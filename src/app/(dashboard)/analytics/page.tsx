// src/app/(dashboard)/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChartRequests } from "@/components/dashboard/charts/bar-chart-requests";
import { PieChartTypes } from "@/components/dashboard/charts/pie-chart-types";
import { content } from "@/lib/content";

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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/analytics/performance");
      const json = await res.json();
      setData(json.data);
      setLoading(false);
    }
    fetchData();
  }, []);

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
        <h1 className="text-2xl font-bold">{ct.title}</h1>

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

        {/* Admin performance table */}
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
      </div>
    </div>
  );
}
