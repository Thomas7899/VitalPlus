// db/seed-production-2026.ts
/**
 * 🚀 PRODUCTION SEED für 2026
 * Dieses Script fügt Daten direkt in die Neon-Datenbank ein.
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

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBloodPressure(): [number, number] {
  const chance = Math.random();
  if (chance < 0.7) return [getRandomInt(110, 125), getRandomInt(70, 80)];
  if (chance < 0.9) return [getRandomInt(130, 145), getRandomInt(85, 95)];
  return [getRandomInt(145, 160), getRandomInt(95, 105)];
}

async function main() {
  const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1";
  
  // Prüfe aktuelle Daten
  const existingCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM health_data 
    WHERE user_id = ${userId} AND date >= '2026-01-01'
  `);
  console.log(`📊 Vorhandene 2026-Einträge: ${existingCount.rows[0].count}`);
  
  // Lösche existierende 2026-Daten (falls vorhanden) für sauberen Start
  if (Number(existingCount.rows[0].count) > 0) {
    console.log("🗑️ Lösche existierende 2026-Daten...");
    await db.execute(sql`
      DELETE FROM health_data WHERE user_id = ${userId} AND date >= '2026-01-01'
    `);
  }
  
  // Generiere Daten vom 1. Januar bis heute
  const currentYear = 2026;
  const startDate = new Date(Date.UTC(currentYear, 0, 1)); // 1. Jan 2026 UTC
  const endDate = new Date(); // Heute
  
  console.log(`\n📅 Generiere Daten von ${startDate.toISOString().split('T')[0]} bis ${endDate.toISOString().split('T')[0]}...`);
  
  const entries: any[] = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const [systolic, diastolic] = getRandomBloodPressure();
    
    // Frühstück (07:00-09:00 UTC)
    const breakfast = new Date(`${dateStr}T${String(getRandomInt(7, 9)).padStart(2, '0')}:${String(getRandomInt(0, 59)).padStart(2, '0')}:00Z`);
    entries.push({
      userId,
      date: breakfast,
      steps: getRandomInt(7000, 15000),
      heartRate: getRandomInt(60, 85),
      sleepHours: parseFloat((Math.random() * 3 + 5).toFixed(1)),
      weight: parseFloat((75 + Math.random() * 2 - 1).toFixed(1)),
      calories: getRandomInt(400, 700),
      mealType: "Frühstück",
      respiratoryRate: getRandomInt(12, 20),
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      bmi: parseFloat((75 / Math.pow(1.79, 2)).toFixed(1)),
      bodyTemp: parseFloat((36.5 + Math.random() * 1).toFixed(1)),
      oxygenSaturation: parseFloat((Math.random() * 5 + 95).toFixed(1)),
      stairSteps: getRandomInt(0, 100),
      elevation: getRandomInt(0, 200),
      muscleMass: parseFloat((Math.random() * 2 + 30).toFixed(1)),
      bodyFat: parseFloat((Math.random() * 15 + 20).toFixed(1)),
    });
    
    // Mittagessen (12:00-14:00 UTC)
    const lunch = new Date(`${dateStr}T${String(getRandomInt(12, 14)).padStart(2, '0')}:${String(getRandomInt(0, 59)).padStart(2, '0')}:00Z`);
    entries.push({
      userId,
      date: lunch,
      calories: getRandomInt(500, 900),
      mealType: "Mittagessen"
    });
    
    // Abendessen (18:00-20:00 UTC)
    const dinner = new Date(`${dateStr}T${String(getRandomInt(18, 20)).padStart(2, '0')}:${String(getRandomInt(0, 59)).padStart(2, '0')}:00Z`);
    entries.push({
      userId,
      date: dinner,
      calories: getRandomInt(500, 800),
      mealType: "Abendessen"
    });
    
    // Optional: Snack
    if (Math.random() > 0.5) {
      const snack = new Date(`${dateStr}T${String(getRandomInt(15, 16)).padStart(2, '0')}:${String(getRandomInt(0, 59)).padStart(2, '0')}:00Z`);
      entries.push({
        userId,
        date: snack,
        calories: getRandomInt(100, 300),
        mealType: "Snacks"
      });
    }
  }
  
  console.log(`📝 Füge ${entries.length} Einträge ein...`);
  
  // Batch-Insert in Gruppen von 100
  for (let i = 0; i < entries.length; i += 100) {
    const batch = entries.slice(i, i + 100);
    await db.insert(schema.healthData).values(batch);
    process.stdout.write(`\r  Progress: ${Math.min(i + 100, entries.length)}/${entries.length}`);
  }
  
  console.log("\n\n✅ Daten erfolgreich eingefügt!");
  
  // Verifiziere
  const verifyCount = await db.execute(sql`
    SELECT COUNT(*) as count FROM health_data 
    WHERE user_id = ${userId} AND date >= '2026-01-01'
  `);
  console.log(`📊 Neue 2026-Einträge: ${verifyCount.rows[0].count}`);
  
  // Zeige die neuesten Einträge
  const recent = await db.execute(sql`
    SELECT date, steps, calories, meal_type 
    FROM health_data 
    WHERE user_id = ${userId} 
    ORDER BY date DESC 
    LIMIT 5
  `);
  console.log("\n📋 Neueste Einträge:");
  recent.rows.forEach((r: any) => {
    console.log(`  ${r.date} | Steps: ${r.steps ?? '-'} | Cal: ${r.calories ?? '-'} | ${r.meal_type ?? '-'}`);
  });
}

main()
  .catch(e => console.error("❌ Fehler:", e))
  .finally(() => pool.end().then(() => process.exit(0)));
