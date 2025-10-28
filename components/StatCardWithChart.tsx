"use client";

import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metric } from "@/components/metrics";
import { cn } from "@/lib/utils";

interface StatCardWithChartProps {
  data: any[];
  metric: Metric;
}

export function StatCardWithChart({ data, metric }: StatCardWithChartProps) {
  const { chartData, latestValue, delta } = useMemo(() => {
    const relevantData = data
      .filter((d) => d[metric.key] != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const chartData = relevantData.slice(-30).map((d) => ({
      date: new Date(d.date).toLocaleDateString("de-DE"),
      value: d[metric.key],
    }));

    if (relevantData.length < 2) {
      return { chartData, latestValue: relevantData[0]?.[metric.key], delta: 0 };
    }

    const latestValue = relevantData[relevantData.length - 1][metric.key];
    const previousValue = relevantData[relevantData.length - 2][metric.key];
    const delta = latestValue - previousValue;

    return { chartData, latestValue, delta };
  }, [data, metric.key]);

  const deltaColor = delta > 0 ? "text-red-500" : delta < 0 ? "text-green-600" : "text-slate-500";
  const deltaSign = delta > 0 ? "+" : "";

  return (
    <Card className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-800">{metric.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold text-slate-900">
            {latestValue?.toFixed(1) ?? "–"}
            <span className="text-xl font-normal text-slate-500 ml-1">{metric.unit}</span>
          </p>
          {delta !== 0 && (
            <p className={cn("font-semibold", deltaColor)}>
              {deltaSign}{delta.toFixed(1)}
            </p>
          )}
        </div>
        <div className="h-24 mt-4 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                }}
                labelStyle={{ fontWeight: "bold" }}
                formatter={(value: number) => [`${value.toFixed(1)} ${metric.unit}`, metric.label]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={metric.color || "#8884d8"}
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}