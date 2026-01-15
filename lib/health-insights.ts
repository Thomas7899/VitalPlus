// lib/health-insights.ts
/**
 * Health Insights & Trend Analysis
 * Verbesserte Analyse-Logik mit medizinisch fundierten Heuristiken
 */

import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, gte, asc, and } from "drizzle-orm";
import OpenAI from "openai";
import { generateEmbedding, createHealthSummaryForEmbedding } from "./embeddings";
import { 
  TrendDirection, 
  classifyTrend, 
  classifyBloodPressure, 
  getBloodPressureCategoryLabel 
} from "@/types/health-domain";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ============================================
// 📊 TYPES
// ============================================

export interface Insight {
  metric: string;
  metricLabel: string;
  trend: TrendDirection;
  delta: number;
  recommendation: string;
  priority: "low" | "medium" | "high";
}

interface MetricConfig {
  label: string;
  unit: string;
  goodTrend: "increasing" | "decreasing" | "stable";
  thresholds: { warning: number; critical: number };
}

// ============================================
// ⚙️ CONFIGURATION
// ============================================

const MOVING_WINDOW = 7;
const MIN_DATA_POINTS = 10; // Mindestens 10 Datenpunkte für valide Analyse

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  sleepHours: {
    label: "Schlaf",
    unit: "h",
    goodTrend: "increasing",
    thresholds: { warning: 6, critical: 5 },
  },
  heartRate: {
    label: "Ruhepuls",
    unit: "bpm",
    goodTrend: "decreasing", // Niedrigerer Ruhepuls = fitter
    thresholds: { warning: 85, critical: 100 },
  },
  steps: {
    label: "Schritte",
    unit: "",
    goodTrend: "increasing",
    thresholds: { warning: 5000, critical: 3000 },
  },
  weight: {
    label: "Gewicht",
    unit: "kg",
    goodTrend: "stable", // Abhängig vom Ziel
    thresholds: { warning: 5, critical: 10 }, // % Änderung
  },
  bodyTemp: {
    label: "Körpertemperatur",
    unit: "°C",
    goodTrend: "stable",
    thresholds: { warning: 37.5, critical: 38.5 },
  },
};

// ============================================
// 📈 TREND ANALYSIS
// ============================================

/**
 * Berechnet Health Insights basierend auf Trendanalyse
 * Verwendet gleitende Durchschnitte und prozentuale Veränderungen
 */
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

  if (entries.length < MIN_DATA_POINTS) {
    return [];
  }

  const insights: Insight[] = [];
  const metricsToAnalyze = ["steps", "sleepHours", "heartRate", "bodyTemp", "weight"] as const;

  for (const metric of metricsToAnalyze) {
    const config = METRIC_CONFIGS[metric];
    if (!config) continue;

    const series = entries
      .map((e) => e[metric])
      .filter((val): val is number => typeof val === "number" && val > 0);

    if (series.length < MOVING_WINDOW * 2) continue;

    const insight = analyzeMetricTrend(metric, series, config);
    if (insight) {
      insights.push(insight);
    }
  }

  // Sortiere nach Priorität
  return insights.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function analyzeMetricTrend(
  metric: string,
  series: number[],
  config: MetricConfig
): Insight | null {
  const recent = series.slice(-MOVING_WINDOW);
  const previous = series.slice(-(MOVING_WINDOW * 2), -MOVING_WINDOW);

  const recentAvg = average(recent);
  const previousAvg = average(previous);

  if (!previousAvg || previousAvg === 0) return null;

  const delta = (recentAvg - previousAvg) / previousAvg;
  const trend = classifyTrend(delta * 100, 5);
  
  // Bestimme Priorität basierend auf Trend und Config
  let priority: "low" | "medium" | "high" = "low";
  const isPositiveTrend = 
    (config.goodTrend === "increasing" && trend === TrendDirection.INCREASING) ||
    (config.goodTrend === "decreasing" && trend === TrendDirection.DECREASING) ||
    (config.goodTrend === "stable" && trend === TrendDirection.STABLE);

  if (!isPositiveTrend) {
    priority = Math.abs(delta) > 0.15 ? "high" : "medium";
  }

  return {
    metric,
    metricLabel: config.label,
    trend,
    delta,
    recommendation: buildRecommendation(metric, trend, delta, config),
    priority,
  };
}

function buildRecommendation(
  metric: string, 
  trend: TrendDirection, 
  delta: number, 
  config: MetricConfig
): string {
  const percent = Math.abs(Math.round(delta * 100));
  const direction = delta > 0 ? "gestiegen" : "gesunken";

  const recommendations: Record<string, Record<TrendDirection, string>> = {
    sleepHours: {
      [TrendDirection.DECREASING]: `Deine Schlafdauer ist um ${percent}% ${direction}. Versuche, eine regelmäßige Schlafenszeit einzuhalten und elektronische Geräte vor dem Schlafengehen zu meiden.`,
      [TrendDirection.INCREASING]: `Tolle Entwicklung! Deine Schlafdauer hat sich um ${percent}% verbessert. Halte diese gute Routine bei.`,
      [TrendDirection.STABLE]: `Deine Schlafdauer ist stabil. Achte weiterhin auf 7-9 Stunden pro Nacht.`,
    },
    heartRate: {
      [TrendDirection.INCREASING]: `Dein Ruhepuls ist um ${percent}% ${direction}. Dies kann auf Stress, Dehydrierung oder Übertraining hindeuten. Gönne dir ausreichend Erholung.`,
      [TrendDirection.DECREASING]: `Dein Ruhepuls sinkt - ein Zeichen für verbesserte Fitness! Weiter so.`,
      [TrendDirection.STABLE]: `Dein Ruhepuls ist stabil. Regelmäßiges Ausdauertraining kann ihn weiter verbessern.`,
    },
    steps: {
      [TrendDirection.DECREASING]: `Deine Schritte sind um ${percent}% ${direction}. Versuche, kleine Spaziergänge in deinen Tag einzubauen.`,
      [TrendDirection.INCREASING]: `Großartig! Du bewegst dich ${percent}% mehr als zuvor. Dein Körper dankt es dir.`,
      [TrendDirection.STABLE]: `Dein Aktivitätslevel ist konstant. Setze dir neue Ziele für zusätzliche Motivation.`,
    },
    weight: {
      [TrendDirection.INCREASING]: `Dein Gewicht ist um ${percent}% ${direction}. Beobachte deine Ernährung und Bewegung.`,
      [TrendDirection.DECREASING]: `Dein Gewicht ist um ${percent}% ${direction}. Bei ungewolltem Gewichtsverlust empfehle ich einen Arztbesuch.`,
      [TrendDirection.STABLE]: `Dein Gewicht ist stabil - das ist oft ein gutes Zeichen für eine ausgewogene Lebensweise.`,
    },
    bodyTemp: {
      [TrendDirection.INCREASING]: `Deine Körpertemperatur zeigt einen leichten Anstieg. Bei Fieber über 38°C solltest du einen Arzt aufsuchen.`,
      [TrendDirection.DECREASING]: `Deine Körpertemperatur normalisiert sich.`,
      [TrendDirection.STABLE]: `Deine Körpertemperatur ist im Normalbereich.`,
    },
  };

  return recommendations[metric]?.[trend] || 
    `${config.label} ${trend === TrendDirection.STABLE ? "unverändert" : `um ${percent}% ${direction}`}.`;
}

// ============================================
// 🧠 EMBEDDING UPDATES
// ============================================

/**
 * Aktualisiert das Health-Embedding für einen User
 * Verwendet für RAG-basierte Empfehlungen
 */
export async function updateHealthEmbeddingForUser(userId: string): Promise<{
  content: string;
  embedding: number[];
} | null> {
  const data = await db
    .select()
    .from(healthData)
    .where(eq(healthData.userId, userId))
    .orderBy(healthData.date)
    .limit(30);

  if (data.length === 0) {
    console.log(`Keine Daten für User ${userId.slice(0, 8)}... gefunden.`);
    return null;
  }

  // Berechne Durchschnittswerte
  const summary = {
    avgSteps: averageNonZero(data.map((d) => d.steps)),
    avgSleep: averageNonZero(data.map((d) => d.sleepHours)),
    avgHeartRate: averageNonZero(data.map((d) => d.heartRate)),
    avgWeight: averageNonZero(data.map((d) => d.weight)),
    avgCalories: averageNonZero(data.map((d) => d.calories)),
    avgSystolic: averageNonZero(data.map((d) => d.bloodPressureSystolic)),
    avgDiastolic: averageNonZero(data.map((d) => d.bloodPressureDiastolic)),
    avgOxygen: averageNonZero(data.map((d) => d.oxygenSaturation)),
  };

  // Erstelle strukturierten Text für Embedding
  const embeddingText = createHealthSummaryForEmbedding(summary);

  // Generiere AI-Analyse
  const analysisContent = await generateHealthAnalysis(summary);

  // Kombiniere für Embedding
  const fullContent = `${embeddingText}\n\nAnalyse: ${analysisContent}`;

  // Generiere Embedding
  const embedding = await generateEmbedding(fullContent);

  // Speichere in DB
  await db
    .insert(healthEmbeddings)
    .values({
      userId,
      content: fullContent,
      embedding,
    })
    .onConflictDoUpdate({
      target: healthEmbeddings.userId,
      set: {
        content: fullContent,
        embedding,
      },
    });

  console.log(`✅ HealthEmbedding für User ${userId.slice(0, 8)}... aktualisiert.`);

  return { content: fullContent, embedding };
}

async function generateHealthAnalysis(summary: {
  avgSteps: number;
  avgSleep: number;
  avgHeartRate: number;
  avgWeight: number;
  avgCalories: number;
  avgSystolic: number;
  avgDiastolic: number;
  avgOxygen: number;
}): Promise<string> {
  // Blutdruck-Klassifikation
  let bpInfo = "";
  if (summary.avgSystolic > 0 && summary.avgDiastolic > 0) {
    const bpCategory = classifyBloodPressure(summary.avgSystolic, summary.avgDiastolic);
    bpInfo = `Blutdruck: ${getBloodPressureCategoryLabel(bpCategory)}.`;
  }

  const prompt = `Erstelle eine prägnante Gesundheitszusammenfassung (50-80 Wörter) basierend auf:
- Schritte/Tag: ${summary.avgSteps || "keine Daten"}
- Kalorien/Tag: ${summary.avgCalories || "keine Daten"}
- Schlaf: ${summary.avgSleep ? `${summary.avgSleep.toFixed(1)}h` : "keine Daten"}
- Ruhepuls: ${summary.avgHeartRate ? `${summary.avgHeartRate} bpm` : "keine Daten"}
- Gewicht: ${summary.avgWeight ? `${summary.avgWeight.toFixed(1)} kg` : "keine Daten"}
- ${bpInfo || "Blutdruck: keine Daten"}
- O2-Sättigung: ${summary.avgOxygen ? `${summary.avgOxygen}%` : "keine Daten"}

Fokussiere auf: Gesamtbild, auffällige Werte, 1-2 konkrete Empfehlungen. Keine Diagnosen stellen.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein präziser Gesundheits-Analyst. Antworte kurz und faktenbasiert." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    return response.choices[0].message.content || "Analyse nicht verfügbar.";
  } catch (error) {
    console.error("Health analysis generation failed:", error);
    return "Automatische Analyse derzeit nicht verfügbar.";
  }
}

// ============================================
// 🔧 UTILITIES
// ============================================

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function averageNonZero(nums: (number | null | undefined)[]): number {
  const filtered = nums.filter((n): n is number => typeof n === "number" && n > 0);
  if (filtered.length === 0) return 0;
  return Math.round((filtered.reduce((a, b) => a + b, 0) / filtered.length) * 10) / 10;
}
