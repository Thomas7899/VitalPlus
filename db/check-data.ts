// db/check-data.ts
import "dotenv/config";
import { db } from "./client";
import { sql } from "drizzle-orm";

async function check() {
  const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1";
  
  // 1. Server-Zeit
  console.log("\n📅 SERVER-ZEITINFORMATIONEN:");
  const serverDate = await db.execute(sql`
    SELECT 
      CURRENT_DATE as today_utc, 
      NOW() as now_utc, 
      current_setting('TIMEZONE') as timezone
  `);
  console.log(serverDate.rows[0]);
  
  // 2. Gesamt-Einträge
  console.log("\n📊 DATEN-STATISTIKEN:");
  const total = await db.execute(sql`
    SELECT COUNT(*) as total FROM health_data WHERE user_id = ${userId}
  `);
  console.log("Gesamt-Einträge:", total.rows[0]);
  
  // 3. Einträge für CURRENT_DATE (UTC)
  const todayUtc = await db.execute(sql`
    SELECT COUNT(*) as count FROM health_data 
    WHERE user_id = ${userId} AND date::date = CURRENT_DATE
  `);
  console.log("Einträge für CURRENT_DATE (UTC):", todayUtc.rows[0]);
  
  // 4. Einträge für den lokalen 15. Januar
  const jan15 = await db.execute(sql`
    SELECT COUNT(*) as count FROM health_data 
    WHERE user_id = ${userId} AND date::date = '2026-01-15'
  `);
  console.log("Einträge für 2026-01-15:", jan15.rows[0]);
  
  // 5. Die neuesten 5 Einträge
  console.log("\n📋 NEUESTE 5 EINTRÄGE:");
  const recent = await db.execute(sql`
    SELECT id, date, steps, calories, meal_type 
    FROM health_data 
    WHERE user_id = ${userId} 
    ORDER BY date DESC 
    LIMIT 5
  `);
  recent.rows.forEach((r: any) => {
    console.log(`  ${r.date} | Steps: ${r.steps ?? '-'} | Cal: ${r.calories ?? '-'} | ${r.meal_type ?? '-'}`);
  });
  
  // 6. Einträge pro Tag im Januar 2026
  console.log("\n📆 EINTRÄGE PRO TAG (Januar 2026):");
  const perDay = await db.execute(sql`
    SELECT date::date as day, COUNT(*) as entries 
    FROM health_data 
    WHERE user_id = ${userId} AND date >= '2026-01-01' 
    GROUP BY date::date 
    ORDER BY day DESC
    LIMIT 20
  `);
  perDay.rows.forEach((r: any) => console.log(`  ${r.day}: ${r.entries} Einträge`));
}

check()
  .catch(e => console.error("❌ Fehler:", e))
  .finally(() => process.exit(0));
