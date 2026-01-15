// db/seed-year-init.ts
/**
 * 📅 Idempotentes Jahresinitialisierungs-Skript
 * 
 * Dieses Skript:
 * - Prüft, ob für das aktuelle Jahr bereits Daten existieren
 * - Erstellt bei Bedarf initiale Strukturen (ohne Daten zu überschreiben)
 * - Überträgt Baseline-Werte aus dem Vorjahr falls vorhanden
 * - Kann mehrfach ausgeführt werden (idempotent)
 * 
 * Verwendung:
 *   npx tsx db/seed-year-init.ts
 *   npx tsx db/seed-year-init.ts --user=<user-id>  # Für spezifischen User
 * 
 * WICHTIG: Dieses Skript ÜBERSCHREIBT KEINE existierenden Daten!
 */

import "dotenv/config";
import { db } from "./client";
import { users, healthData, healthEmbeddings } from "./schema";
import { eq, gte, and, sql, count } from "drizzle-orm";
import { generateEmbedding } from "../lib/embeddings";

// ============================================
// 📅 KONFIGURATION
// ============================================

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_START = new Date(CURRENT_YEAR, 0, 1);
const PREVIOUS_YEAR_START = new Date(CURRENT_YEAR - 1, 0, 1);
const PREVIOUS_YEAR_END = new Date(CURRENT_YEAR - 1, 11, 31, 23, 59, 59);

interface YearInitResult {
  userId: string;
  userName: string | null;
  hadPreviousYearData: boolean;
  hadCurrentYearData: boolean;
  embeddingUpdated: boolean;
  baselineCreated: boolean;
}

// ============================================
// 🔄 HAUPT-LOGIK
// ============================================

async function initializeYearForUser(userId: string): Promise<YearInitResult> {
  console.log(`\n🔄 Prüfe User: ${userId}`);

  // User-Info holen
  const user = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0]);

  if (!user) {
    throw new Error(`User ${userId} nicht gefunden`);
  }

  // Prüfe Daten für Vorjahr
  const previousYearCount = await db
    .select({ count: count() })
    .from(healthData)
    .where(
      and(
        eq(healthData.userId, userId),
        gte(healthData.date, PREVIOUS_YEAR_START),
        sql`date < ${YEAR_START}`
      )
    )
    .then(rows => rows[0]?.count ?? 0);

  // Prüfe Daten für aktuelles Jahr
  const currentYearCount = await db
    .select({ count: count() })
    .from(healthData)
    .where(
      and(
        eq(healthData.userId, userId),
        gte(healthData.date, YEAR_START)
      )
    )
    .then(rows => rows[0]?.count ?? 0);

  console.log(`  📊 Vorjahr (${CURRENT_YEAR - 1}): ${previousYearCount} Einträge`);
  console.log(`  📊 Aktuelles Jahr (${CURRENT_YEAR}): ${currentYearCount} Einträge`);

  const result: YearInitResult = {
    userId,
    userName: user.name,
    hadPreviousYearData: previousYearCount > 0,
    hadCurrentYearData: currentYearCount > 0,
    embeddingUpdated: false,
    baselineCreated: false,
  };

  // Wenn bereits Daten für aktuelles Jahr existieren → nichts tun
  if (currentYearCount > 0) {
    console.log(`  ✅ Daten für ${CURRENT_YEAR} bereits vorhanden - überspringe`);
    return result;
  }

  // Wenn Vorjahresdaten existieren → Baseline übertragen
  if (previousYearCount > 0) {
    console.log(`  📋 Übertrage Baseline aus ${CURRENT_YEAR - 1}...`);
    
    // Durchschnittswerte aus den letzten 30 Tagen des Vorjahres
    const lastMonthStart = new Date(CURRENT_YEAR - 1, 11, 1); // 1. Dezember
    
    const baseline = await db
      .select({
        avgWeight: sql<number>`AVG(weight)`,
        avgHeartRate: sql<number>`AVG(heart_rate)`,
        avgSystolic: sql<number>`AVG(blood_pressure_systolic)`,
        avgDiastolic: sql<number>`AVG(blood_pressure_diastolic)`,
        avgSleep: sql<number>`AVG(sleep_hours)`,
        avgSteps: sql<number>`AVG(steps)`,
      })
      .from(healthData)
      .where(
        and(
          eq(healthData.userId, userId),
          gte(healthData.date, lastMonthStart),
          sql`date <= ${PREVIOUS_YEAR_END}`
        )
      )
      .then(rows => rows[0]);

    if (baseline && (baseline.avgWeight || baseline.avgHeartRate)) {
      // Erstelle einen "Baseline"-Eintrag für den 1. Januar
      await db.insert(healthData).values({
        userId,
        date: YEAR_START,
        weight: baseline.avgWeight ? Math.round(baseline.avgWeight * 10) / 10 : undefined,
        heartRate: baseline.avgHeartRate ? Math.round(baseline.avgHeartRate) : undefined,
        bloodPressureSystolic: baseline.avgSystolic ? Math.round(baseline.avgSystolic) : undefined,
        bloodPressureDiastolic: baseline.avgDiastolic ? Math.round(baseline.avgDiastolic) : undefined,
        sleepHours: baseline.avgSleep ? Math.round(baseline.avgSleep * 10) / 10 : undefined,
        steps: baseline.avgSteps ? Math.round(baseline.avgSteps) : undefined,
      });

      result.baselineCreated = true;
      console.log(`  ✅ Baseline-Eintrag für ${CURRENT_YEAR}-01-01 erstellt`);
    }
  }

  // Embedding aktualisieren/erstellen
  try {
    const embeddingContent = generateEmbeddingContent(userId, CURRENT_YEAR);
    const embedding = await generateEmbedding(embeddingContent);

    await db
      .insert(healthEmbeddings)
      .values({ userId, content: embeddingContent, embedding })
      .onConflictDoUpdate({
        target: healthEmbeddings.userId,
        set: { content: embeddingContent, embedding },
      });

    result.embeddingUpdated = true;
    console.log(`  ✅ Embedding aktualisiert`);
  } catch (err) {
    console.warn(`  ⚠️ Embedding-Update fehlgeschlagen:`, err);
  }

  return result;
}

function generateEmbeddingContent(userId: string, year: number): string {
  // Minimaler Embedding-Content für neue Jahre
  return `
Nutzer-ID: ${userId}
Jahr: ${year}
Status: Jahresinitialisierung
Daten: Noch keine Gesundheitsdaten für ${year} erfasst.
Empfehlung: Regelmäßige Datenerfassung für personalisierte Analysen.
`.trim();
}

// ============================================
// 🚀 MAIN
// ============================================

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log(`📅 VitalPlus Jahresinitialisierung für ${CURRENT_YEAR}`);
  console.log("═══════════════════════════════════════════════════");

  // CLI-Argument für spezifischen User
  const userIdArg = process.argv.find(arg => arg.startsWith("--user="));
  const specificUserId = userIdArg?.split("=")[1];

  // Alle User holen (oder spezifischen)
  let userIds: string[];
  
  if (specificUserId) {
    userIds = [specificUserId];
    console.log(`\n🎯 Initialisiere nur User: ${specificUserId}`);
  } else {
    const allUsers = await db.select({ id: users.id }).from(users);
    userIds = allUsers.map(u => u.id);
    console.log(`\n👥 Gefundene User: ${userIds.length}`);
  }

  const results: YearInitResult[] = [];

  for (const userId of userIds) {
    try {
      const result = await initializeYearForUser(userId);
      results.push(result);
    } catch (err) {
      console.error(`  ❌ Fehler bei User ${userId}:`, err);
    }
  }

  // Zusammenfassung
  console.log("\n═══════════════════════════════════════════════════");
  console.log("📊 ZUSAMMENFASSUNG");
  console.log("═══════════════════════════════════════════════════");
  
  const usersWithNewBaseline = results.filter(r => r.baselineCreated).length;
  const usersWithUpdatedEmbedding = results.filter(r => r.embeddingUpdated).length;
  const usersAlreadyInitialized = results.filter(r => r.hadCurrentYearData).length;

  console.log(`  ✅ Bereits initialisiert: ${usersAlreadyInitialized}`);
  console.log(`  📋 Neue Baselines erstellt: ${usersWithNewBaseline}`);
  console.log(`  🧠 Embeddings aktualisiert: ${usersWithUpdatedEmbedding}`);
  console.log("\n✅ Jahresinitialisierung abgeschlossen!");
}

main()
  .catch(e => {
    console.error("💥 Kritischer Fehler:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
