// src/components/dashboard/charts/invoices-chart.tsx
"use client";

import { Pie, PieChart, Label } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function InvoicesChart({
  pending,
  paid,
}: {
  pending: number;
  paid: number;
}) {
  const total = pending + paid;

  // Ensure the chart renders even when total is zero
  let chartData = [];
  if (total === 0) {
    // Add a dummy slice with negligible value to keep the pie visible
    chartData = [
      { name: "Pending", value: 0.01, fill: "var(--color-chart-1)" },
      { name: "Paid", value: 0.01, fill: "var(--color-chart-2)" },
    ];
  } else {
    chartData = [
      { name: "Pending", value: pending, fill: "var(--color-chart-1)" },
      { name: "Paid", value: paid, fill: "var(--color-chart-2)" },
    ];
  }

  const chartConfig = {
    pending: {
      label: "Pending",
      color: "var(--color-chart-1)",
    },
    paid: {
      label: "Paid",
      color: "var(--color-chart-2)",
    },
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[140px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={40}
          strokeWidth={5}
        >
          <Label
            className="dark:text-white"
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan className="text-xl font-bold">{total}</tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20}>
                      Total
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
