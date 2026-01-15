import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  const today = await pool.query('SELECT CURRENT_DATE, NOW()');
  console.log('📅 Server-Zeit:', today.rows[0]);
  
  const todayData = await pool.query(`
    SELECT date, steps, heart_rate, sleep_hours, weight, calories, meal_type, blood_pressure_systolic, blood_pressure_diastolic
    FROM health_data 
    WHERE user_id = '2fbb9c24-cdf8-49db-9b74-0762017445a1'
    AND date::date = CURRENT_DATE
    ORDER BY date
  `);
  console.log('\n📊 Heute (' + today.rows[0].current_date + '):', todayData.rowCount, 'Einträge');
  todayData.rows.forEach((r: any) => {
    const time = new Date(r.date).toISOString().split('T')[1].substring(0,5);
    console.log(`  ${time} | Steps: ${r.steps || '-'} | HR: ${r.heart_rate || '-'} | BP: ${r.blood_pressure_systolic || '-'}/${r.blood_pressure_diastolic || '-'} | Cal: ${r.calories} | ${r.meal_type}`);
  });
  
  // Gesamt-Statistik für 2026
  const stats = await pool.query(`
    SELECT 
      COUNT(DISTINCT date::date) as days,
      COUNT(*) as entries,
      AVG(steps) FILTER (WHERE steps IS NOT NULL) as avg_steps,
      AVG(heart_rate) FILTER (WHERE heart_rate IS NOT NULL) as avg_hr
    FROM health_data 
    WHERE user_id = '2fbb9c24-cdf8-49db-9b74-0762017445a1'
    AND date >= '2026-01-01'
  `);
  console.log('\n📈 Gesamt-Statistik 2026:');
  console.log('  Tage:', stats.rows[0].days);
  console.log('  Einträge:', stats.rows[0].entries);
  console.log('  Ø Schritte:', Math.round(stats.rows[0].avg_steps));
  console.log('  Ø Herzfrequenz:', Math.round(stats.rows[0].avg_hr), 'bpm');
  
  await pool.end();
}

verify().catch(console.error);
