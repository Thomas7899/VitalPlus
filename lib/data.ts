// lib/data.ts
import { Gauge, Moon, Weight, Thermometer } from "lucide-react";
import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, gte, asc, desc, and, sql } from "drizzle-orm";
import { getHealthInsights } from "./health-insights";
import type { DashboardTrendData } from "@/types/health";
import { unstable_cache } from "next/cache";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "gerade eben";
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Minuten`;
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Stunden`;
  if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
  const days = Math.floor(seconds / 86400);
  return `vor ${Math.round(days / 7)} Wochen`;
}

export type DashboardStatsData = {
  steps: string;
  calories: string;
  heartRate: string;
  sleep: string;
  stepsChange: string;
  caloriesChange: string;
  heartRateChange: string;
  sleepChange: string;
};

function calculateChange(
  current: number | null | undefined,
  previous: number | null | undefined
): string {
  if (current == null && previous == null) return "N/A";
  if (!previous || previous === 0) return "Neu";
  const change = ((Number(current ?? 0) - previous) / previous) * 100;
  if (Math.abs(change) < 1) return "Stabil";
  return `${change > 0 ? "+" : ""}${Math.round(change)}%`;
}

function avg(arr: (number | null | undefined)[]) {
  const vals = arr.filter((n): n is number => typeof n === "number");
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}
function sum(arr: (number | null | undefined)[]) {
  const vals = arr.filter((n): n is number => typeof n === "number");
  return vals.reduce((a, b) => a + b, 0);
}
function maxNumber(arr: (number | null | undefined)[]) {
  const vals = arr.filter((n): n is number => typeof n === "number");
  return vals.length ? Math.max(...vals) : null;
}

// 📊 Interne Funktion für Dashboard Stats
async function _getDashboardStats(userId: string): Promise<DashboardStatsData> {
  const todayAgg = await db.execute(sql`
    SELECT 
      COALESCE(MAX(steps), 0)::int AS steps,
      COALESCE(SUM(calories), 0)::float AS calories,
      COALESCE(AVG(heart_rate), 0)::float AS heart_rate,
      COALESCE(AVG(sleep_hours), 0)::float AS sleep_hours
    FROM health_data
    WHERE "user_id" = ${userId} AND date::date = CURRENT_DATE
  `);
  const yesterdayAgg = await db.execute(sql`
    SELECT 
      COALESCE(MAX(steps), 0)::int AS steps,
      COALESCE(SUM(calories), 0)::float AS calories,
      COALESCE(AVG(heart_rate), 0)::float AS heart_rate,
      COALESCE(AVG(sleep_hours), 0)::float AS sleep_hours
    FROM health_data
    WHERE "user_id" = ${userId} AND date::date = CURRENT_DATE - INTERVAL '1 day'
  `);

  const t = todayAgg.rows[0] ?? { steps: 0, calories: 0, heart_rate: 0, sleep_hours: 0 };
  const y = yesterdayAgg.rows[0] ?? { steps: 0, calories: 0, heart_rate: 0, sleep_hours: 0 };

  return {
    steps: Number(t.steps).toLocaleString("de-DE"),
    calories: Number(t.calories).toLocaleString("de-DE"),
    heartRate: t.heart_rate ? `${Math.round(Number(t.heart_rate))} bpm` : "N/A",
    sleep: t.sleep_hours ? `${Number(t.sleep_hours).toFixed(1)}h` : "N/A",
    stepsChange: calculateChange(Number(t.steps), Number(y.steps)),
    caloriesChange: calculateChange(Number(t.calories), Number(y.calories)),
    heartRateChange: calculateChange(Number(t.heart_rate), Number(y.heart_rate)),
    sleepChange: calculateChange(Number(t.sleep_hours), Number(y.sleep_hours)),
  };
}

/**
 * 🚀 Gecachte Dashboard Stats
 * - Cache für 60 Sekunden
 * - Tag: health-data für Revalidation nach neuen Einträgen
 */
export const getDashboardStats = unstable_cache(
  _getDashboardStats,
  ["dashboard-stats"],
  {
    revalidate: 60, // 60 Sekunden Cache
    tags: ["health-data"], // Ermöglicht manuelle Revalidation
  }
);

export async function getDashboardActivities(userId: string) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const activities = await db
    .select()
    .from(healthData)
    .where(and(eq(healthData.userId, userId), gte(healthData.date, sevenDaysAgo)))
    .orderBy(desc(healthData.date))
    .limit(10);

  const detectType = (a: (typeof activities)[0]) => {
    if (a.steps && a.steps > 8000) return "WORKOUT";
    if (a.heartRate && a.heartRate > 90) return "BLOOD_PRESSURE";
    if (a.sleepHours && a.sleepHours < 6) return "SLEEP_WARNING";
    if (a.mealType) return "MEAL";
    return "DEFAULT";
  };

  const createTitle = (a: (typeof activities)[0]) => {
    switch (detectType(a)) {
      case "WORKOUT":
        return "Aktive Bewegung erfasst";
      case "BLOOD_PRESSURE":
        return "Hohe Herzfrequenz erkannt";
      case "SLEEP_WARNING":
        return "Zu wenig Schlaf";
      case "MEAL":
        return `${a.mealType} erfasst`;
      default:
        return "Aktivität erfasst";
    }
  };

  const createDescription = (a: (typeof activities)[0]) => {
    const desc: string[] = [];
    if (a.steps) desc.push(`${a.steps.toLocaleString("de-DE")} Schritte`);
    if (a.calories) desc.push(`${a.calories.toLocaleString("de-DE")} kcal`);
    if (a.heartRate) desc.push(`Puls ${a.heartRate} bpm`);
    if (a.sleepHours) desc.push(`${a.sleepHours.toFixed(1)}h Schlaf`);
    return desc.join(", ") || "Keine weiteren Details";
  };

  return activities.map((a) => ({
    id: a.id,
    type: detectType(a),
    title: createTitle(a),
    description: createDescription(a),
    timeAgo: timeAgo(a.date),
  }));
}

export type DashboardActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timeAgo: string;
};

export type DashboardActivityData = DashboardActivityItem[];

export async function getDashboardTrends(
  userId: string
): Promise<DashboardTrendData[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const healthMetrics = await db
    .select()
    .from(healthData)
    .where(and(eq(healthData.userId, userId), gte(healthData.date, yesterday)))
    .orderBy(asc(healthData.date));

  const todayData = healthMetrics.filter((m) => new Date(m.date) >= today);
  const yesterdayData = healthMetrics.filter(
    (m) => new Date(m.date) >= yesterday && new Date(m.date) < today
  );

  const _avg = (arr: (number | null | undefined)[]) => {
    const vals = arr.filter((n): n is number => typeof n === "number");
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const latest =
    todayData[todayData.length - 1] ?? yesterdayData[yesterdayData.length - 1];

  return [
    {
      id: "heartRate",
      title: "Herzfrequenz",
      value: latest?.heartRate ? `${Math.round(latest.heartRate)} bpm` : "N/A",
      change: calculateChange(_avg(todayData.map((d) => d.heartRate)), _avg(yesterdayData.map((d) => d.heartRate))),
      color: "purple",
      icon: Gauge,
    },
    {
      id: "weight",
      title: "Gewicht",
      value: latest?.weight ? `${latest.weight.toFixed(1)} kg` : "N/A",
      change: calculateChange(_avg(todayData.map((d) => d.weight)), _avg(yesterdayData.map((d) => d.weight))),
      color: "blue",
      icon: Weight,
    },
    {
      id: "bodyTemp",
      title: "Körpertemperatur",
      value: latest?.bodyTemp ? `${latest.bodyTemp.toFixed(1)} °C` : "N/A",
      change: calculateChange(_avg(todayData.map((d) => d.bodyTemp)), _avg(yesterdayData.map((d) => d.bodyTemp))),
      color: "orange",
      icon: Thermometer,
    },
    {
      id: "sleepDuration",
      title: "Schlafdauer",
      value: latest?.sleepHours ? `${latest.sleepHours.toFixed(1)}h` : "N/A",
      change: calculateChange(_avg(todayData.map((d) => d.sleepHours)), _avg(yesterdayData.map((d) => d.sleepHours))),
      color: "purple",
      icon: Moon,
    },
  ];
}

export async function getHealthInsightsData(userId: string) {
  const insights = await getHealthInsights(userId);
  if (insights.length === 0) {
    return {
      title: "Dein wöchentlicher Einblick",
      insight: "Es sind noch nicht genügend Daten für eine detaillierte Analyse vorhanden.",
      recommendation: "Erfasse deine Gesundheitsdaten regelmäßig, um wertvolle Einblicke zu erhalten.",
    };
  }

  const primaryInsight = insights[0];
  return {
    title: "Dein wöchentlicher Einblick",
    insight: `Dein Trend für '${primaryInsight.metric}' ist ${primaryInsight.trend}.`,
    recommendation: primaryInsight.recommendation,
  };
}

export type HealthInsightData = Awaited<ReturnType<typeof getHealthInsightsData>>;