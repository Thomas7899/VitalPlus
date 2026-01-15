import "dotenv/config";
import { db } from "./client";
import { users, healthData, healthEmbeddings } from "./schema";
import { eq, and, sql } from "drizzle-orm";
import { generateEmbedding } from "../lib/embeddings";

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBloodPressure(): [number, number] {
  const chance = Math.random();
  if (chance < 0.7) return [getRandomInt(110, 125), getRandomInt(70, 80)];
  if (chance < 0.9) return [getRandomInt(130, 145), getRandomInt(85, 95)];
  return [getRandomInt(145, 160), getRandomInt(95, 105)];
}

function getInitialWeight(gender: string | null): number {
  if (gender === "männlich") return 75;
  if (gender === "weiblich") return 65;
  return 70;
}

async function main() {
  console.log("🖥️ Verwende lokale Postgres-Verbindung (TCP)");

  const allUsers = await db.select({ id: users.id, gender: users.gender }).from(users);
  console.log(`👥 Gefundene User: ${allUsers.length}`);

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  for (const user of allUsers) {
    console.log(`\n🔄 Generiere Daten für User: ${user.id}`);

    for (let d = new Date(yearStart); d <= todayEnd; d.setDate(d.getDate() + 1)) {
      const existing = await db
        .select()
        .from(healthData)
        .where(
          and(
            eq(healthData.userId, user.id),
            eq(sql`DATE(${healthData.date})`, d.toISOString().slice(0, 10))
          )
        )
        .then(r => r.length > 0);

      if (existing) continue;

      const breakfast = new Date(d);
      breakfast.setHours(getRandomInt(7, 9), getRandomInt(0, 59));
      
      const lunch = new Date(d);
      lunch.setHours(getRandomInt(12, 14), getRandomInt(0, 59));
      
      const dinner = new Date(d);
      dinner.setHours(getRandomInt(18, 20), getRandomInt(0, 59));

      const [systolic, diastolic] = getRandomBloodPressure();

      const entries = [
        {
          userId: user.id,
          date: breakfast,
          steps: getRandomInt(7000, 15000),
          heartRate: getRandomInt(60, 85),
          sleepHours: parseFloat((Math.random() * 3 + 5).toFixed(1)),
          weight: parseFloat((getInitialWeight(user.gender) + Math.random() * 2 - 1).toFixed(1)),
          calories: getRandomInt(400, 700),
          mealType: "Frühstück",
          respiratoryRate: getRandomInt(12, 20),
          bloodPressureSystolic: systolic,
          bloodPressureDiastolic: diastolic,
          bmi: parseFloat((getInitialWeight(user.gender) / Math.pow(1.75, 2)).toFixed(1)),
          bodyTemp: parseFloat((36.5 + Math.random() * 1).toFixed(1)),
          oxygenSaturation: parseFloat((Math.random() * 5 + 95).toFixed(1)),
          stairSteps: getRandomInt(0, 100),
          elevation: getRandomInt(0, 200),
          muscleMass: parseFloat((Math.random() * 2 + 30).toFixed(1)),
          bodyFat: parseFloat((Math.random() * 15 + 20).toFixed(1)),
        },
        { userId: user.id, date: lunch, calories: getRandomInt(500, 900), mealType: "Mittagessen" },
        { userId: user.id, date: dinner, calories: getRandomInt(500, 800), mealType: "Abendessen" },
      ];

      if (Math.random() > 0.5) {
        const snack = new Date(d);
        snack.setHours(getRandomInt(15, 16), getRandomInt(0, 59));
        entries.push({ userId: user.id, date: snack, calories: getRandomInt(100, 300), mealType: "Snacks" });
      }

      await db.insert(healthData).values(entries);
    }

    console.log(`✅ Vollständige Daten für ${currentYear} für User ${user.id} erzeugt`);

    const content = `
Max Müller, männlich, 30 Jahre, 1.79m groß.
Aktivitätslevel: Aktiv mit regelmäßigem Training.
Ziel: Muskelaufbau und Kraft steigern.
Durchschnittlich ~10.000 Schritte/Tag, Puls 60–85 bpm,
Schlafdauer ~6–8h, Gewicht ~75 kg.
Trainiert 4x pro Woche Kraftsport.`;
    const embedding = await generateEmbedding(content);
    await db
      .insert(healthEmbeddings)
      .values({ userId: user.id, content, embedding })
      .onConflictDoUpdate({
        target: healthEmbeddings.userId,
        set: { content, embedding },
      });

    console.log(`🧠 HealthEmbedding aktualisiert für ${user.id}`);
  }

  console.log("\n🎉 Fertig! Vollständige Jahresdaten erstellt.");
}

main()
  .catch(e => console.error("❌ Fehler:", e))
  .finally(() => process.exit(0));