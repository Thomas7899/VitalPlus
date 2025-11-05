// lib/health-insights.ts
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, gte, asc, and } from "drizzle-orm";
import OpenAI from "openai";
import { generateEmbedding } from "../lib/embeddings";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
      if (trend === "fallend")
        return `Schlafdauer sinkt (${percent} %). Abends Routine beruhigen.`;
      if (trend === "steigend")
        return `Schlafdauer steigt (${percent} %). Weitermachen.`;
      return "Schlafdauer konstant. Zielwerte prüfen.";
    case "heartRate":
      if (trend === "steigend")
        return `Herzfrequenz steigt (${percent} %). Belastung reduzieren, Hydration prüfen.`;
      if (trend === "fallend")
        return `Herzfrequenz sinkt (${percent} %). Gute Erholung, Fortschritt beobachten.`;
      return "Herzfrequenz stabil. Trainingstagebuch fortführen.";
    default:
      if (trend === "steigend")
        return `${metric} steigt (${percent} %). Entwicklung beobachten.`;
      if (trend === "fallend")
        return `${metric} sinkt (${percent} %). Analyse lohnt sich.`;
      return `${metric} unverändert.`;
  }
}

export async function getHealthInsights(
  userId: string,
  days = 30
): Promise<Insight[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const entries = await db
    .select()
    .from(healthData)
    .where(and(eq(healthData.userId, userId), gte(healthData.date, fromDate)))
    .orderBy(asc(healthData.date));

  const metrics: (keyof (typeof entries)[number])[] = [
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

    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const previousAvg = previous.reduce((sum, v) => sum + v, 0) / previous.length;

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

export async function updateHealthEmbeddingForUser(userId: string) {
  const data = await db
    .select()
    .from(healthData)
    .where(eq(healthData.userId, userId))
    .orderBy(healthData.date)
    .limit(30);

  if (data.length === 0) {
    console.log(`Keine Daten für User ${userId} gefunden. Überspringe.`);
    return;
  }

  const summary = {
    avgSteps: average(data.map((d) => d.steps || 0)),
    avgSleep: average(data.map((d) => d.sleepHours || 0)),
    avgHeartRate: average(data.map((d) => d.heartRate || 0)),
    avgWeight: average(data.map((d) => d.weight || 0)),
    avgCalories: average(data.map((d) => d.calories || 0)),
    avgSystolic: average(data.map((d) => d.bloodPressureSystolic || 0)),
    avgDiastolic: average(data.map((d) => d.bloodPressureDiastolic || 0)),
    avgOxygen: average(data.map((d) => d.oxygenSaturation || 0)),
  };

  const prompt = `
Analysiere die Gesundheitsdaten des Nutzers:
- Schritte: ${summary.avgSteps}
- Kalorienverbrauch: ${summary.avgCalories}
- Schlaf: ${summary.avgSleep}h
- Puls: ${summary.avgHeartRate} bpm
- Gewicht: ${summary.avgWeight} kg
- Blutdruck: ${summary.avgSystolic}/${summary.avgDiastolic} mmHg
- Sauerstoffsättigung: ${summary.avgOxygen} %

Gib eine prägnante Zusammenfassung (50–100 Wörter) der aktuellen Gesundheit, Trends und möglichen Empfehlungen.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Du bist ein präziser Gesundheits-Analyst." },
      { role: "user", content: prompt },
    ],
  });

  const analysisContent = response.choices[0].message.content;

  if (!analysisContent) {
    throw new Error("Fehler bei der Erstellung der KI-Analyse.");
  }

  const embedding = await generateEmbedding(analysisContent);

  await db
    .insert(healthEmbeddings)
    .values({
      userId: userId,
      content: analysisContent,
      embedding: embedding,
    })
    .onConflictDoUpdate({
      target: healthEmbeddings.userId,
      set: {
        content: analysisContent,
        embedding: embedding,
      },
    });

  console.log(`✅ HealthEmbedding für User ${userId} erfolgreich aktualisiert.`);

  return { content: analysisContent, embedding };
}

function average(nums: number[]): string {
  const filtered = nums.filter((n) => n > 0);
  if (filtered.length === 0) {
    return "0.0";
  }
  return (filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(1);
}
