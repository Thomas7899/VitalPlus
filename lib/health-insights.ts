import { prisma } from "@/lib/prisma";

type Trend = "steigend" | "fallend" | "stabil";

interface Insight {
  metric: string;
  trend: Trend;
  delta: number;
  recommendation: string;
}

const MOVING_WINDOW = 7;

function classifyTrend(delta: number): Trend {
  if (delta > 0.05) return "steigend";
  if (delta < -0.05) return "fallend";
  return "stabil";
}

function buildRecommendation(metric: string, trend: Trend, delta: number): string {
  const percent = Math.round(delta * 100);
  switch (metric) {
    case "sleepHours":
      if (trend === "fallend") return `Schlafdauer sinkt (${percent} %). Abends Routine beruhigen.`;
      if (trend === "steigend") return `Schlafdauer steigt (${percent} %). Weitermachen.`;
      return "Schlafdauer konstant. Zielwerte prüfen.";
    case "heartRate":
      if (trend === "steigend") return `Herzfrequenz steigt (${percent} %). Belastung reduzieren, Hydration prüfen.`;
      if (trend === "fallend") return `Herzfrequenz sinkt (${percent} %). Gute Erholung, Fortschritt beobachten.`;
      return "Herzfrequenz stabil. Trainingstagebuch fortführen.";
    default:
      if (trend === "steigend") return `${metric} steigt (${percent} %). Entwicklung beobachten.`;
      if (trend === "fallend") return `${metric} sinkt (${percent} %). Analyse lohnt sich.`;
      return `${metric} unverändert.`;
  }
}

export async function getHealthInsights(userId: string, days = 30): Promise<Insight[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const entries = await prisma.healthData.findMany({
    where: { userId, date: { gte: fromDate } },
    orderBy: { date: "asc" },
  });

  const metrics: (keyof typeof entries[number])[] = [
    "steps",
    "sleepHours",
    "heartRate",
    "bodyTemp",
    "weight",
  ];

  const insights: Insight[] = [];

  metrics.forEach((metric) => {
    const series = entries
      .map((e) => e[metric])
      .filter((val): val is number => typeof val === "number");

    if (series.length < MOVING_WINDOW * 2) return;

    const recent = series.slice(-MOVING_WINDOW);
    const previous = series.slice(-(MOVING_WINDOW * 2), -MOVING_WINDOW);

    const recentAvg =
      recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const previousAvg =
      previous.reduce((sum, v) => sum + v, 0) / previous.length;

    if (!previousAvg) return;

    const delta = (recentAvg - previousAvg) / previousAvg;
    const trend = classifyTrend(delta);

    insights.push({
      metric,
      trend,
      delta,
      recommendation: buildRecommendation(metric as string, trend, delta),
    });
  });

  return insights;
}