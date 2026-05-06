// src/components/dashboard/charts/bar-chart-requests.tsx

"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

interface BarChartRequestsProps {
  data: { month: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Requests",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function BarChartRequests({ data }: BarChartRequestsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requests Overview</CardTitle>
        <CardDescription>Last 12 months activity</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />

            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => value.slice(0, 3)} />

            <YAxis tickLine={false} axisLine={false} />

            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />

            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Monthly request trends <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Showing total requests per month</div>
      </CardFooter>
    </Card>
  );
}
