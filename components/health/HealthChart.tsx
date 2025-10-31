"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { Metric } from "@/components/utils/metrics";

type Props = {
  data: any[];
  metric?: Metric;
  metrics?: Metric[];
};

export function HealthChart({ data, metric, metrics }: Props) {
  const metricsToShow = useMemo(() => (metrics ? metrics : metric ? [metric] : []), [metric, metrics]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Nur die letzten 60 Tage für eine bessere Übersichtlichkeit
    const filteredAndSortedData = data
      .filter((d: any) => metricsToShow.some(m => d[m.key] != null))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-60);

    return filteredAndSortedData.map((d: any) => {
      const entry: { [key: string]: any } = {
        date: new Date(d.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      };
      metricsToShow.forEach(m => {
        if (d[m.key] != null) {
          entry[m.key] = d[m.key];
        }
      });
      return entry;
    });
  }, [data, metricsToShow]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value, name) => {
            const currentMetric = metricsToShow.find(m => m.key === name);
            return [`${value} ${currentMetric?.unit || ''}`, currentMetric?.label || name];
          }}
        />
        <Legend />
        {metricsToShow.map((m) => (
          <Line
            key={m.key}
            type="monotone"
            dataKey={m.key}
            stroke={m.color}
            name={m.label}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
