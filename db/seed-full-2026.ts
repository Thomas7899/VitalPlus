// db/seed-full-2026.ts
/**
 * 🚀 VOLLSTÄNDIGES SEED-SCRIPT FÜR 2026
 * Generiert realistische Gesundheitsdaten für das gesamte Jahr 2026
 * Optimiert für Präsentationszwecke und KI-Funktionen
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("❌ DATABASE_URL nicht gesetzt!");
}

console.log("🔌 Verbinde mit:", DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool, { schema });

// ============================================
// 📊 REALISTISCHE DATENGENERIERUNG
// ============================================

// Gewichtsverlauf: Langsamer Trend mit natürlichen Schwankungen
function generateWeightProgression(dayOfYear: number, baseWeight: number): number {
  // Leichter Trend: -3kg über das Jahr (Fitness-Ziel)
  const trend = -3 * (dayOfYear / 365);
  // Tägliche Schwankung: ±0.5kg
  const dailyVariation = (Math.random() - 0.5) * 1;
  // Wochenend-Effekt: Etwas mehr am Montag
  const dayOfWeek = dayOfYear % 7;
  const weekendEffect = dayOfWeek === 0 ? 0.3 : 0;
  
  return Math.round((baseWeight + trend + dailyVariation + weekendEffect) * 10) / 10;
}

// Schritte: Wochentags mehr als am Wochenende
function generateSteps(dayOfYear: number): number {
  const dayOfWeek = dayOfYear % 7;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  
  const baseSteps = isWeekend ? 6000 : 9000;
  const variation = Math.floor(Math.random() * 5000);
  
  // Manchmal ein sehr aktiver Tag (Wandern, Sport)
  if (Math.random() > 0.9) {
    return baseSteps + variation + 8000;
  }
  
  return baseSteps + variation;
}

// Schlaf: Realistische Muster
function generateSleep(dayOfYear: number): number {
  const dayOfWeek = dayOfYear % 7;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  
  // Am Wochenende länger schlafen
  const baseSleep = isWeekend ? 8.0 : 6.5;
  const variation = (Math.random() - 0.3) * 2;
  
  return Math.round((baseSleep + variation) * 10) / 10;
}

// Herzfrequenz: Abhängig von Aktivität
function generateHeartRate(steps: number): number {
  // Höhere Schritte = höherer Durchschnittspuls
  const baseRate = 65;
  const activityBonus = Math.floor(steps / 1000);
  const variation = Math.floor(Math.random() * 10) - 5;
  
  return Math.min(95, Math.max(55, baseRate + activityBonus + variation));
}

// Blutdruck: Leichte Trends
function generateBloodPressure(dayOfYear: number): [number, number] {
  // Basis-Werte (leicht erhöht zu Jahresbeginn, besser gegen Ende)
  const improvement = Math.floor(dayOfYear / 30) * 0.5;
  
  const baseSystolic = 128 - improvement;
  const baseDiastolic = 82 - improvement * 0.5;
  
  const systolicVariation = Math.floor(Math.random() * 15) - 7;
  const diastolicVariation = Math.floor(Math.random() * 10) - 5;
  
  // Gelegentlich erhöhte Werte (Stress, Kaffee, etc.)
  const stressDay = Math.random() > 0.85;
  const stressBonus = stressDay ? 15 : 0;
  
  return [
    Math.round(baseSystolic + systolicVariation + stressBonus),
    Math.round(baseDiastolic + diastolicVariation + stressBonus * 0.5)
  ];
}

// Kalorien: Mahlzeiten-basiert
function generateMealCalories(mealType: string, dayOfYear: number): number {
  const dayOfWeek = dayOfYear % 7;
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
  
  const mealBases: Record<string, number> = {
    "Frühstück": isWeekend ? 550 : 400,
    "Mittagessen": 650,
    "Abendessen": isWeekend ? 800 : 600,
    "Snacks": 200
  };
  
  const base = mealBases[mealType] || 500;
  const variation = Math.floor(Math.random() * 200) - 100;
  
  return Math.max(150, base + variation);
}

// Körperfett: Langsamer Rückgang bei Fitness-Ziel
function generateBodyFat(dayOfYear: number, baseBodyFat: number): number {
  const trend = -2 * (dayOfYear / 365); // -2% über das Jahr
  const variation = (Math.random() - 0.5) * 0.5;
  return Math.round((baseBodyFat + trend + variation) * 10) / 10;
}

// Muskelmasse: Leichter Aufbau
function generateMuscleMass(dayOfYear: number, baseMuscleMass: number): number {
  const trend = 1.5 * (dayOfYear / 365); // +1.5kg über das Jahr
  const variation = (Math.random() - 0.5) * 0.3;
  return Math.round((baseMuscleMass + trend + variation) * 10) / 10;
}

// ============================================
// 🚀 MAIN SEED FUNCTION
// ============================================

async function main() {
  const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1";
  
  console.log("\n🗑️ Lösche alle existierenden Daten für 2026...");
  await db.execute(sql`
    DELETE FROM health_data WHERE user_id = ${userId} AND date >= '2026-01-01'
  `);
  
  const baseWeight = 78; // Startgewicht Januar
  const baseBodyFat = 22; // Start-Körperfett %
  const baseMuscleMass = 32; // Start-Muskelmasse kg
  
  console.log("\n📅 Generiere Daten für das gesamte Jahr 2026...");
  
  const entries: any[] = [];
  const startDate = new Date(Date.UTC(2026, 0, 1)); // 1. Januar 2026
  const endDate = new Date(Date.UTC(2026, 11, 31)); // 31. Dezember 2026
  
  let dayOfYear = 0;
  
  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    dayOfYear++;
    const dateStr = d.toISOString().split('T')[0];
    
    const steps = generateSteps(dayOfYear);
    const sleepHours = generateSleep(dayOfYear);
    const heartRate = generateHeartRate(steps);
    const weight = generateWeightProgression(dayOfYear, baseWeight);
    const [systolic, diastolic] = generateBloodPressure(dayOfYear);
    const bodyFat = generateBodyFat(dayOfYear, baseBodyFat);
    const muscleMass = generateMuscleMass(dayOfYear, baseMuscleMass);
    
    // Frühstück (06:00-09:00 UTC)
    const breakfastHour = 6 + Math.floor(Math.random() * 3);
    const breakfast = new Date(`${dateStr}T${String(breakfastHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
    
    entries.push({
      userId,
      date: breakfast,
      steps,
      heartRate,
      sleepHours,
      weight,
      calories: generateMealCalories("Frühstück", dayOfYear),
      mealType: "Frühstück",
      respiratoryRate: 14 + Math.floor(Math.random() * 4),
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      bmi: Math.round((weight / Math.pow(1.79, 2)) * 10) / 10,
      bodyTemp: Math.round((36.4 + Math.random() * 0.8) * 10) / 10,
      oxygenSaturation: Math.round((96 + Math.random() * 3) * 10) / 10,
      stairSteps: Math.floor(Math.random() * 50) + 10,
      elevation: Math.floor(Math.random() * 100),
      muscleMass,
      bodyFat,
    });
    
    // Mittagessen (11:00-14:00 UTC)
    const lunchHour = 11 + Math.floor(Math.random() * 3);
    const lunch = new Date(`${dateStr}T${String(lunchHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
    entries.push({
      userId,
      date: lunch,
      calories: generateMealCalories("Mittagessen", dayOfYear),
      mealType: "Mittagessen"
    });
    
    // Abendessen (17:00-20:00 UTC)
    const dinnerHour = 17 + Math.floor(Math.random() * 3);
    const dinner = new Date(`${dateStr}T${String(dinnerHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
    entries.push({
      userId,
      date: dinner,
      calories: generateMealCalories("Abendessen", dayOfYear),
      mealType: "Abendessen"
    });
    
    // Snacks (50% Wahrscheinlichkeit)
    if (Math.random() > 0.5) {
      const snackHour = 15 + Math.floor(Math.random() * 2);
      const snack = new Date(`${dateStr}T${String(snackHour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`);
      entries.push({
        userId,
        date: snack,
        calories: generateMealCalories("Snacks", dayOfYear),
        mealType: "Snacks"
      });
    }
    
    // Fortschrittsanzeige
    if (dayOfYear % 30 === 0) {
      console.log(`  📊 ${dayOfYear}/365 Tage generiert...`);
    }
  }
  
  console.log(`\n📝 Füge ${entries.length} Einträge ein...`);
  
  // Batch-Insert in Gruppen von 500
  for (let i = 0; i < entries.length; i += 500) {
    const batch = entries.slice(i, i + 500);
    await db.insert(schema.healthData).values(batch);
    process.stdout.write(`\r  Progress: ${Math.min(i + 500, entries.length)}/${entries.length}`);
  }
  
  // Embedding aktualisieren
  console.log("\n\n🧠 Aktualisiere Health-Embedding...");
  const embeddingContent = `
Max Müller, männlich, 31 Jahre (Geburtsjahr 1995), 1.79m groß.
Aktivitätslevel: Aktiv mit regelmäßigem Training (4x pro Woche Kraftsport).
Ziel: Muskelaufbau und Gewichtsoptimierung.

Jahresverlauf 2026:
- Startgewicht Januar: ${baseWeight}kg → Zielgewicht Dezember: ${baseWeight - 3}kg
- Körperfett: von ${baseBodyFat}% auf ca. ${baseBodyFat - 2}%
- Muskelmasse: von ${baseMuscleMass}kg auf ca. ${baseMuscleMass + 1.5}kg

Durchschnittliche Tageswerte:
- Schritte: 8.000-12.000 pro Tag
- Puls: 65-85 bpm (Ruhe)
- Schlaf: 6.5-8h pro Nacht
- Blutdruck: Zu Jahresbeginn leicht erhöht (128/82), verbessert sich über das Jahr

Ernährung:
- Frühstück: 400-550 kcal
- Mittagessen: 550-750 kcal
- Abendessen: 500-800 kcal
- Snacks: gelegentlich 100-300 kcal
- Gesamtkalorienzufuhr: ca. 1800-2500 kcal/Tag

Besondere Muster:
- Wochenenden: Mehr Schlaf, weniger Schritte, mehr Kalorien
- Aktive Tage: Gelegentlich >15.000 Schritte (Wandern, Sport)
- Stress-Tage: Ca. 15% der Tage leicht erhöhter Blutdruck
`.trim();

  // Embedding generieren und speichern (falls Funktion verfügbar)
  try {
    const { generateEmbedding } = await import("../lib/embeddings");
    const embedding = await generateEmbedding(embeddingContent);
    
    await db.insert(schema.healthEmbeddings)
      .values({ userId, content: embeddingContent, embedding })
      .onConflictDoUpdate({
        target: schema.healthEmbeddings.userId,
        set: { content: embeddingContent, embedding },
      });
    console.log("✅ Embedding aktualisiert");
  } catch (e) {
    console.log("⚠️ Embedding konnte nicht generiert werden (OpenAI API nicht verfügbar)");
  }
  
  // Statistiken ausgeben
  console.log("\n═══════════════════════════════════════════════════");
  console.log("📊 SEED-STATISTIKEN");
  console.log("═══════════════════════════════════════════════════");
  
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total_entries,
      COUNT(DISTINCT date::date) as days_with_data,
      MIN(date) as first_entry,
      MAX(date) as last_entry
    FROM health_data 
    WHERE user_id = ${userId} AND date >= '2026-01-01'
  `);
  const s = stats.rows[0] as any;
  console.log(`  📝 Gesamt-Einträge: ${s.total_entries}`);
  console.log(`  📅 Tage mit Daten: ${s.days_with_data}`);
  console.log(`  🗓️ Erster Eintrag: ${s.first_entry}`);
  console.log(`  🗓️ Letzter Eintrag: ${s.last_entry}`);
  
  // Stichprobe ausgeben
  console.log("\n📋 STICHPROBE (letzte 5 Einträge):");
  const sample = await db.execute(sql`
    SELECT date, steps, heart_rate, sleep_hours, weight, calories, meal_type
    FROM health_data 
    WHERE user_id = ${userId}
    ORDER BY date DESC 
    LIMIT 5
  `);
  sample.rows.forEach((r: any) => {
    const date = new Date(r.date).toISOString().split('T')[0];
    console.log(`  ${date} | Steps: ${r.steps ?? '-'} | HR: ${r.heart_rate ?? '-'} | Sleep: ${r.sleep_hours ?? '-'}h | Weight: ${r.weight ?? '-'}kg | Cal: ${r.calories} | ${r.meal_type}`);
  });
  
  console.log("\n✅ Seed für 2026 erfolgreich abgeschlossen!");
}

main()
  .catch(e => console.error("❌ Fehler:", e))
  .finally(() => pool.end().then(() => process.exit(0)));
