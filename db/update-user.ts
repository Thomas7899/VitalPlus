// db/update-user.ts
// Einmaliges Script zum Aktualisieren des Benutzers in Produktion
// Ausführen mit: npx tsx db/update-user.ts

import "dotenv/config";
import { db } from "./client";
import { users, healthEmbeddings } from "./schema";
import { eq } from "drizzle-orm";
import { generateEmbedding } from "../lib/embeddings";

const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1";

async function main() {
  console.log("🔄 Aktualisiere Benutzer...");

  // 1. User-Daten aktualisieren
  await db
    .update(users)
    .set({
      name: "Max Müller",
      email: "max.mueller@example.com",
      activityLevel: "active",
      healthGoal: "muskelaufbau",
      targetWeight: 78,
      customAlertThresholds: {
        maxHeartRate: 95,
        minHeartRate: 45,
        minSteps: 8000,
        maxCalories: 3000,
      },
    })
    .where(eq(users.id, userId));

  console.log("✅ Benutzer aktualisiert: Max Müller");

  // 2. Embedding aktualisieren
  const content = `
Max Müller, männlich, 30 Jahre, 1.79m groß.
Aktivitätslevel: Aktiv mit regelmäßigem Training.
Ziel: Muskelaufbau und Kraft steigern.
Durchschnittlich ~10.000 Schritte/Tag, Puls 60–85 bpm,
Schlafdauer ~6–8h, Gewicht ~75 kg.
Trainiert 4x pro Woche Kraftsport.
  `;

  const embedding = await generateEmbedding(content);

  await db
    .update(healthEmbeddings)
    .set({
      content,
      embedding,
    })
    .where(eq(healthEmbeddings.userId, userId));

  console.log("✅ HealthEmbedding aktualisiert");
  console.log("\n🎉 Fertig! Der Benutzer heißt jetzt Max Müller.");
}

main()
  .catch((e) => console.error("❌ Fehler:", e))
  .finally(() => process.exit(0));
