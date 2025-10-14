"use client";

import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { metrics } from "@/components/metrics";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type Trend = "steigend" | "fallend" | "stabil";

interface Insight {
  metric: string;
  trend: Trend;
  delta: number;
  recommendation: string;
}

interface HealthInsightsProps {
  userId: string | null;
  className?: string;
}

export function HealthInsights({ userId, className }: HealthInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricMap = useMemo(
    () =>
      Object.fromEntries(
        metrics.map((entry) => [entry.key, { label: entry.label, color: entry.color }])
      ),
    []
  );

  useEffect(() => {
    if (!userId) {
      setInsights([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function fetchInsights() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/health/insights?userId=${userId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Fehler beim Laden der Insights");
        }

        const data: Insight[] = await response.json();
        setInsights(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
        setInsights([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInsights();

    return () => controller.abort();
  }, [userId]);

  const trendIconMap: Record<
    Trend,
    { icon: JSX.Element; badgeClass: string; label: string }
  > = {
    steigend: {
      icon: <TrendingUp className="h-4 w-4 text-emerald-600" />,
      badgeClass: "bg-emerald-100 text-emerald-700",
      label: "Steigend",
    },
    fallend: {
      icon: <TrendingDown className="h-4 w-4 text-rose-600" />,
      badgeClass: "bg-rose-100 text-rose-700",
      label: "Fallend",
    },
    stabil: {
      icon: <Minus className="h-4 w-4 text-slate-500" />,
      badgeClass: "bg-slate-100 text-slate-600",
      label: "Stabil",
    },
  };

  const renderContent = () => {
    if (!userId) {
      return (
        <Card className="border-dashed border-slate-300 bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6 text-sm text-slate-500">
            Wähle einen Nutzer, um personalisierte Insights zu sehen.
          </CardContent>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Trend-Insights</CardTitle>
          </CardHeader>
          <CardContent className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            Lade Insights...
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="bg-white/70 backdrop-blur-sm border border-rose-200">
          <CardHeader className="flex flex-row items-center gap-2 text-rose-600">
            <AlertCircle className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Fehler</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-rose-600">{error}</CardContent>
        </Card>
      );
    }

    if (insights.length === 0) {
      return (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Trend-Insights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500">
            Keine ausreichenden Daten für Trendanalysen vorhanden.
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-white/70 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-slate-800">Trend-Insights</CardTitle>
          <p className="text-sm text-slate-500">
            Automatisch generierte Empfehlungen basierend auf den letzten Messwerten.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {insights.map((insight) => {
            const meta = metricMap[insight.metric];
            const trend = trendIconMap[insight.trend];
            const delta = Math.round(insight.delta * 1000) / 10;

            return (
              <div
                key={insight.metric}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="rounded-lg px-3 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: meta?.color ?? "#6366F1" }}
                  >
                    {meta?.label ?? insight.metric}
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
                      trend.badgeClass
                    )}
                  >
                    {trend.icon}
                    {trend.label}
                  </span>

                  <span className="text-sm font-semibold text-slate-700">
                    {delta > 0 ? `+${delta}%` : `${delta}%`}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {insight.recommendation}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  return <div className={cn("space-y-4", className)}>{renderContent()}</div>;
}