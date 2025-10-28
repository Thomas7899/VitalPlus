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
  const [insights, setInsights] = useState<Insight[] | null>(null);
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
      setInsights(null);
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
        setInsights(null);
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
    if (isLoading) {
      return (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Trend-Insights</CardTitle>
          </CardHeader>
          <CardContent
            className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500"
            role="status"
          >
            <Loader2 className="h-6 w-6 animate-spin" />
            Lade Insights...
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="bg-white/70 backdrop-blur-sm border border-rose-200" role="alert">
          <CardHeader className="flex flex-row items-center gap-2 text-rose-600">
            <AlertCircle className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Fehler</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-rose-600">{error}</CardContent>
        </Card>
      );
    }

    if (!insights || insights.length === 0) {
      return (
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Trend-Insights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-500" role="status">
            Keine ausreichenden Daten für Trendanalysen vorhanden.
          </CardContent>
        </Card>
      );
    }

    return (
      <div aria-labelledby="insights-title">
        <h2 id="insights-title" className="text-2xl font-bold text-slate-800 mb-6">Aktuelle Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {insights.map((insight) => {
            const meta = metricMap[insight.metric];
            const trend = trendIconMap[insight.trend];
            const delta = Math.round(insight.delta * 100) / 100;
            const deltaText = `${delta > 0 ? '+' : ''}${delta}%`;

            return (
              <Card key={insight.metric} className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{meta?.label ?? insight.metric}</p>
                      <p className="text-2xl font-bold text-slate-900">{deltaText}</p> 
                      <p className={cn("text-sm",
                        insight.trend === 'steigend' ? 'text-emerald-600' : 
                        insight.trend === 'fallend' ? 'text-rose-600' : 'text-slate-500'
                      )}>
                        {trend.label}
                      </p>
                    </div>
                    <div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform" 
                      style={{'--tw-gradient-from': meta?.color ?? '#60A5FA', '--tw-gradient-to': meta?.color ? `${meta.color}cc` : '#3B82F6'} as React.CSSProperties}
                    >
                      {trend.icon}
                    </div>
                  </div>
                  {insight.recommendation && (
                    <p className="mt-4 text-sm text-slate-600 border-t border-slate-200/80 pt-4">{insight.recommendation}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // return (
  //   <div
  //     className={cn("space-y-4", className)}
  //     aria-live="polite"
  //   >
  //     {renderContent()}
  //   </div>
  // );

  return renderContent();
}