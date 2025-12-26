// db/seed.ts
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./client";
import { users, healthData, healthEmbeddings } from "./schema";
import { sql } from "drizzle-orm";
import { generateEmbedding } from "../lib/embeddings";

async function main() {
  console.log("Sorge für pgvector-Extension...");
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

  console.log("Lösche alte Daten...");
  await db.execute(sql`TRUNCATE TABLE "health_embeddings" RESTART IDENTITY CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE "health_data" RESTART IDENTITY CASCADE;`);
  await db.execute(sql`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);

  console.log("Erstelle neuen Benutzer...");
  const hashedPassword = await bcrypt.hash("password123", 10);
  const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1";

  await db.insert(users).values({
    id: userId,
    email: "max.mueller@example.com",
    name: "Max Müller",
    height: 1.79,
    gender: "männlich",
    dateOfBirth: new Date("1995-01-01"),
    password: hashedPassword,
    // 🆕 Profil-Erweiterungen für Personalisierung
    activityLevel: "active", // sedentary, normal, active, athlete
    healthGoal: "muskelaufbau", // abnehmen, zunehmen, muskelaufbau, gesund_bleiben
    targetWeight: 78,
    customAlertThresholds: {
      maxHeartRate: 95, // Als aktiver Sportler höhere Toleranz
      minHeartRate: 45,
      minSteps: 8000, // Höhere Bewegungserwartung
      maxCalories: 3000, // Mehr Kalorien für Muskelaufbau
    },
  });

  const year = 2025;
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const healthDataArray: any[] = [];

  console.log(`Generiere Gesundheitsdaten für das Jahr ${year}...`);
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const [systolic, diastolic] = getRandomBloodPressure();

    const breakfastTime = new Date(d);
    breakfastTime.setHours(getRandomInt(7, 9), getRandomInt(0, 59));
    healthDataArray.push({
      userId,
      date: breakfastTime,
      steps: getRandomInt(7000, 15000),
      heartRate: getRandomInt(60, 85),
      sleepHours: parseFloat((Math.random() * 3 + 5).toFixed(1)),
      weight: parseFloat((getInitialWeight("männlich") + Math.random() * 2 - 1).toFixed(1)),
      calories: getRandomInt(400, 700),
      mealType: "Frühstück",
      respiratoryRate: getRandomInt(12, 20),
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      bmi: parseFloat((getInitialWeight("männlich") / Math.pow(1.75, 2)).toFixed(1)),
      bodyTemp: parseFloat((36.5 + Math.random() * 1).toFixed(1)),
      oxygenSaturation: parseFloat((Math.random() * 5 + 95).toFixed(1)),
      stairSteps: getRandomInt(0, 100),
      elevation: getRandomInt(0, 200),
      muscleMass: parseFloat((Math.random() * 2 + 30).toFixed(1)),
      bodyFat: parseFloat((Math.random() * 15 + 20).toFixed(1)),
    });

    const lunchTime = new Date(d);
    lunchTime.setHours(getRandomInt(12, 14), getRandomInt(0, 59));
    healthDataArray.push({ userId, date: lunchTime, calories: getRandomInt(500, 900), mealType: "Mittagessen" });

    const dinnerTime = new Date(d);
    dinnerTime.setHours(getRandomInt(18, 20), getRandomInt(0, 59));
    healthDataArray.push({ userId, date: dinnerTime, calories: getRandomInt(500, 800), mealType: "Abendessen" });

    if (Math.random() > 0.5) {
      const snackTime = new Date(d);
      snackTime.setHours(getRandomInt(15, 16), getRandomInt(0, 59));
      healthDataArray.push({ userId, date: snackTime, calories: getRandomInt(100, 300), mealType: "Snacks" });
    }
  }

  await db.insert(healthData).values(healthDataArray);
  console.log("Seed-Daten erfolgreich erstellt.");

  // Embedding-Zusammenfassung generieren + upserten
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
    .values({ userId, content, embedding })
    .onConflictDoUpdate({
      target: healthEmbeddings.userId,
      set: { content, embedding },
    });

  console.log("✅ HealthEmbedding erfolgreich erstellt/aktualisiert.");
}

function getInitialWeight(gender: string | null): number {
  if (gender === "männlich") return 75;
  if (gender === "weiblich") return 65;
  return 70;
}

function getRandomBloodPressure(): [number, number] {
  const chance = Math.random();
  if (chance < 0.7) return [getRandomInt(110, 125), getRandomInt(70, 80)];
  if (chance < 0.9) return [getRandomInt(130, 145), getRandomInt(85, 95)];
  return [getRandomInt(145, 160), getRandomInt(95, 105)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

main()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0));