// lib/data-availability.ts
/**
 * 📊 Daten-Verfügbarkeits-Check für Jahreswechsel & Low-Data-Szenarien
 * 
 * WICHTIG für 2026-Readiness:
 * - Erkennt automatisch fehlende Daten für das aktuelle Jahr
 * - Ermöglicht graceful degradation bei wenig Daten
 * - Liefert Kontext für AI-Analysen
 */

import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, and, gte, lte, sql, count, min, max } from "drizzle-orm";
import { 
  getCurrentYear, 
  getYearStart, 
  getYearEnd, 
  getLastNDays,
  getYearTransitionInfo,
  getMinimumDataDaysForAnalysis,
  type DateRange 
} from "./date-utils";

// ============================================
// 📈 DATEN-STATUS TYPEN
// ============================================

export type DataAvailability = "none" | "insufficient" | "limited" | "sufficient" | "abundant";

export interface DataAvailabilityInfo {
  /** Daten-Status */
  status: DataAvailability;
  /** Anzahl der Einträge im Zeitraum */
  entryCount: number;
  /** Anzahl der Tage mit Daten */
  daysWithData: number;
  /** Ältester Eintrag */
  oldestEntry: Date | null;
  /** Neuester Eintrag */
  latestEntry: Date | null;
  /** Hat Daten für das aktuelle Jahr */
  hasCurrentYearData: boolean;
  /** Ist im frühen Jahr (erste 2 Wochen) */
  isEarlyYear: boolean;
  /** Empfohlene Anzahl Tage für Analyse */
  recommendedAnalysisDays: number;
  /** User-freundliche Nachricht */
  userMessage: string;
  /** Technische Details für AI-Kontext */
  aiContext: string;
}

export interface MetricAvailability {
  metric: string;
  label: string;
  count: number;
  latestValue: number | null;
  latestDate: Date | null;
  hasRecentData: boolean; // Daten in letzten 7 Tagen
}

// ============================================
// 🔍 DATEN-CHECK FUNKTIONEN
// ============================================

/**
 * Prüft die Daten-Verfügbarkeit für einen Benutzer
 * @param userId - Benutzer-ID
 * @param range - Optional: Spezifischer Zeitraum (Default: aktuelles Jahr)
 */
export async function checkDataAvailability(
  userId: string,
  range?: DateRange
): Promise<DataAvailabilityInfo> {
  const yearInfo = getYearTransitionInfo();
  const effectiveRange = range ?? {
    from: getYearStart(),
    to: getYearEnd(),
  };

  // Aggregierte Statistiken in einer Query
  const stats = await db
    .select({
      entryCount: count(),
      daysWithData: sql<number>`COUNT(DISTINCT DATE(date))`,
      oldestEntry: min(healthData.date),
      latestEntry: max(healthData.date),
    })
    .from(healthData)
    .where(
      and(
        eq(healthData.userId, userId),
        gte(healthData.date, effectiveRange.from),
        lte(healthData.date, effectiveRange.to)
      )
    );

  const result = stats[0] ?? {
    entryCount: 0,
    daysWithData: 0,
    oldestEntry: null,
    latestEntry: null,
  };

  const minDays = getMinimumDataDaysForAnalysis();
  const hasCurrentYearData = 
    result.latestEntry != null && 
    result.latestEntry.getFullYear() === getCurrentYear();

  // Status-Klassifizierung
  let status: DataAvailability;
  if (result.entryCount === 0) {
    status = "none";
  } else if (result.daysWithData < minDays) {
    status = "insufficient";
  } else if (result.daysWithData < minDays * 2) {
    status = "limited";
  } else if (result.daysWithData < 90) {
    status = "sufficient";
  } else {
    status = "abundant";
  }

  // User-freundliche Nachricht generieren
  const userMessage = generateUserMessage(status, result.daysWithData, yearInfo.isEarlyYear);
  
  // AI-Kontext für Prompts
  const aiContext = generateAIContext(status, result, yearInfo);

  return {
    status,
    entryCount: result.entryCount,
    daysWithData: result.daysWithData,
    oldestEntry: result.oldestEntry,
    latestEntry: result.latestEntry,
    hasCurrentYearData,
    isEarlyYear: yearInfo.isEarlyYear,
    recommendedAnalysisDays: minDays,
    userMessage,
    aiContext,
  };
}

/**
 * Prüft Verfügbarkeit für spezifische Metriken
 */
export async function checkMetricAvailability(
  userId: string,
  days = 30
): Promise<MetricAvailability[]> {
  const { from } = getLastNDays(days);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const metrics: Array<{ key: keyof typeof healthData.$inferSelect; label: string }> = [
    { key: "steps", label: "Schritte" },
    { key: "heartRate", label: "Herzfrequenz" },
    { key: "bloodPressureSystolic", label: "Blutdruck" },
    { key: "sleepHours", label: "Schlaf" },
    { key: "weight", label: "Gewicht" },
    { key: "calories", label: "Kalorien" },
    { key: "oxygenSaturation", label: "Sauerstoffsättigung" },
    { key: "bodyTemp", label: "Körpertemperatur" },
  ];

  const results: MetricAvailability[] = [];

  for (const metric of metrics) {
    const data = await db
      .select({
        count: count(),
        latestValue: sql<number | null>`
          (SELECT ${sql.identifier(metric.key as string)} 
           FROM health_data 
           WHERE user_id = ${userId} 
             AND ${sql.identifier(metric.key as string)} IS NOT NULL 
           ORDER BY date DESC 
           LIMIT 1)
        `,
        latestDate: sql<Date | null>`
          (SELECT date 
           FROM health_data 
           WHERE user_id = ${userId} 
             AND ${sql.identifier(metric.key as string)} IS NOT NULL 
           ORDER BY date DESC 
           LIMIT 1)
        `,
      })
      .from(healthData)
      .where(
        and(
          eq(healthData.userId, userId),
          gte(healthData.date, from),
          sql`${sql.identifier(metric.key as string)} IS NOT NULL`
        )
      );

    const row = data[0];
    const hasRecentData = row?.latestDate 
      ? row.latestDate >= sevenDaysAgo 
      : false;

    results.push({
      metric: metric.key,
      label: metric.label,
      count: row?.count ?? 0,
      latestValue: row?.latestValue ?? null,
      latestDate: row?.latestDate ?? null,
      hasRecentData,
    });
  }

  return results;
}

/**
 * Schneller Check: Hat der User Daten für das aktuelle Jahr?
 */
export async function hasCurrentYearData(userId: string): Promise<boolean> {
  const yearStart = getYearStart();
  
  const result = await db
    .select({ count: count() })
    .from(healthData)
    .where(
      and(
        eq(healthData.userId, userId),
        gte(healthData.date, yearStart)
      )
    )
    .limit(1);

  return (result[0]?.count ?? 0) > 0;
}

/**
 * Holt den letzten bekannten Wert einer Metrik
 * (Auch aus Vorjahren, für Baseline-Übertragung)
 */
export async function getLastKnownMetricValue(
  userId: string,
  metric: keyof typeof healthData.$inferSelect
): Promise<{ value: number | null; date: Date | null }> {
  const result = await db
    .select({
      value: healthData[metric],
      date: healthData.date,
    })
    .from(healthData)
    .where(
      and(
        eq(healthData.userId, userId),
        sql`${sql.identifier(metric as string)} IS NOT NULL`
      )
    )
    .orderBy(sql`date DESC`)
    .limit(1);

  const row = result[0];
  return {
    value: row?.value as number | null ?? null,
    date: row?.date ?? null,
  };
}

// ============================================
// 📝 NACHRICHTEN-GENERIERUNG
// ============================================

function generateUserMessage(
  status: DataAvailability,
  daysWithData: number,
  isEarlyYear: boolean
): string {
  if (status === "none") {
    if (isEarlyYear) {
      return "🎉 Willkommen im neuen Jahr! Starte jetzt mit der Erfassung deiner Gesundheitsdaten, um personalisierte Einblicke zu erhalten.";
    }
    return "📊 Noch keine Gesundheitsdaten vorhanden. Erfasse deine ersten Daten, um loszulegen!";
  }

  if (status === "insufficient") {
    const remaining = getMinimumDataDaysForAnalysis() - daysWithData;
    return `📈 Du hast Daten für ${daysWithData} Tag${daysWithData === 1 ? "" : "e"}. Noch ${remaining} Tag${remaining === 1 ? "" : "e"} für erste Trend-Analysen!`;
  }

  if (status === "limited") {
    return `📊 ${daysWithData} Tage mit Daten erfasst. Die Analysen werden genauer, je mehr Daten du erfasst.`;
  }

  if (status === "sufficient") {
    return `✅ Gute Datenbasis mit ${daysWithData} Tagen. Personalisierte Analysen sind verfügbar.`;
  }

  return `🏆 Exzellente Datenbasis mit ${daysWithData} Tagen! Detaillierte Langzeit-Analysen verfügbar.`;
}

function generateAIContext(
  status: DataAvailability,
  stats: { entryCount: number; daysWithData: number; oldestEntry: Date | null; latestEntry: Date | null },
  yearInfo: ReturnType<typeof getYearTransitionInfo>
): string {
  const parts: string[] = [];

  parts.push(`[DATEN-KONTEXT]`);
  parts.push(`- Aktuelles Jahr: ${yearInfo.currentYear}`);
  parts.push(`- Tag im Jahr: ${yearInfo.daysIntoNewYear}`);
  parts.push(`- Jahresfortschritt: ${yearInfo.yearProgress}%`);
  parts.push(`- Datenverfügbarkeit: ${status.toUpperCase()}`);
  parts.push(`- Einträge: ${stats.entryCount}`);
  parts.push(`- Tage mit Daten: ${stats.daysWithData}`);

  if (stats.oldestEntry) {
    parts.push(`- Ältester Eintrag: ${stats.oldestEntry.toISOString().split("T")[0]}`);
  }
  if (stats.latestEntry) {
    parts.push(`- Neuester Eintrag: ${stats.latestEntry.toISOString().split("T")[0]}`);
  }

  // Spezielle Hinweise für AI
  if (status === "none" || status === "insufficient") {
    parts.push(`[WICHTIG] Wenig Daten vorhanden - verwende allgemeine Gesundheitsempfehlungen statt individueller Trends.`);
  }

  if (yearInfo.isEarlyYear) {
    parts.push(`[HINWEIS] Frühes Jahr - Daten aus ${yearInfo.previousYear} können als Baseline verwendet werden, falls vorhanden.`);
  }

  return parts.join("\n");
}

// ============================================
// 🏥 BASELINE-FUNKTIONEN
// ============================================

export interface HealthBaseline {
  weight: number | null;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  sleepHours: number | null;
  steps: number | null;
  source: "current_year" | "previous_year" | "default";
  lastUpdated: Date | null;
}

/**
 * Ermittelt die Health-Baseline für einen User
 * Nutzt aktuelle Daten, Vorjahresdaten, oder Defaults
 */
export async function getHealthBaseline(userId: string): Promise<HealthBaseline> {
  const yearStart = getYearStart();
  const previousYearStart = getYearStart(getCurrentYear() - 1);
  
  // Versuche aktuelle Jahresdaten
  const currentYearAvg = await db
    .select({
      weight: sql<number>`AVG(weight)`,
      heartRate: sql<number>`AVG(heart_rate)`,
      systolic: sql<number>`AVG(blood_pressure_systolic)`,
      diastolic: sql<number>`AVG(blood_pressure_diastolic)`,
      sleep: sql<number>`AVG(sleep_hours)`,
      steps: sql<number>`AVG(steps)`,
      latest: max(healthData.date),
    })
    .from(healthData)
    .where(
      and(
        eq(healthData.userId, userId),
        gte(healthData.date, yearStart)
      )
    );

  const current = currentYearAvg[0];
  
  // Wenn aktuelle Daten vorhanden
  if (current?.weight || current?.heartRate || current?.systolic) {
    return {
      weight: current.weight ? Math.round(current.weight * 10) / 10 : null,
      heartRate: current.heartRate ? Math.round(current.heartRate) : null,
      bloodPressureSystolic: current.systolic ? Math.round(current.systolic) : null,
      bloodPressureDiastolic: current.diastolic ? Math.round(current.diastolic) : null,
      sleepHours: current.sleep ? Math.round(current.sleep * 10) / 10 : null,
      steps: current.steps ? Math.round(current.steps) : null,
      source: "current_year",
      lastUpdated: current.latest,
    };
  }

  // Fallback: Vorjahresdaten
  const previousYearAvg = await db
    .select({
      weight: sql<number>`AVG(weight)`,
      heartRate: sql<number>`AVG(heart_rate)`,
      systolic: sql<number>`AVG(blood_pressure_systolic)`,
      diastolic: sql<number>`AVG(blood_pressure_diastolic)`,
      sleep: sql<number>`AVG(sleep_hours)`,
      steps: sql<number>`AVG(steps)`,
      latest: max(healthData.date),
    })
    .from(healthData)
    .where(
      and(
        eq(healthData.userId, userId),
        gte(healthData.date, previousYearStart),
        sql`date < ${yearStart}`
      )
    );

  const previous = previousYearAvg[0];

  if (previous?.weight || previous?.heartRate || previous?.systolic) {
    return {
      weight: previous.weight ? Math.round(previous.weight * 10) / 10 : null,
      heartRate: previous.heartRate ? Math.round(previous.heartRate) : null,
      bloodPressureSystolic: previous.systolic ? Math.round(previous.systolic) : null,
      bloodPressureDiastolic: previous.diastolic ? Math.round(previous.diastolic) : null,
      sleepHours: previous.sleep ? Math.round(previous.sleep * 10) / 10 : null,
      steps: previous.steps ? Math.round(previous.steps) : null,
      source: "previous_year",
      lastUpdated: previous.latest,
    };
  }

  // Fallback: Medizinisch neutrale Defaults
  return {
    weight: null,
    heartRate: 72, // Durchschnittlicher Ruhepuls
    bloodPressureSystolic: 120, // Normaler oberer Wert
    bloodPressureDiastolic: 80, // Normaler unterer Wert
    sleepHours: 7.5, // Empfohlene Schlafdauer
    steps: 8000, // WHO-Empfehlung
    source: "default",
    lastUpdated: null,
  };
}
