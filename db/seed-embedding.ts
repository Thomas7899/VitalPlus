// db/seed-embedding.ts
import "dotenv/config";
import { db } from "./client";
import { healthEmbeddings } from "./schema";
import { generateEmbedding } from "../lib/embeddings";

const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1";

async function main() {
  console.log("🧠 Erzeuge HealthEmbedding...");

  const content = `
Max Müller, männlich, 30 Jahre, 1.79m groß.
Aktivitätslevel: Aktiv mit regelmäßigem Training.
Ziel: Muskelaufbau und Kraft steigern.
Durchschnittlich ~10.000 Schritte/Tag, Puls 60–85 bpm,
Schlafdauer ~6–8h, Gewicht ~75 kg.
Trainiert 4x pro Woche Kraftsport.
  `;

  const embedding = await generateEmbedding(content);

  await db.insert(healthEmbeddings).values({
    userId,
    content,
    embedding,
  });

  console.log("✅ HealthEmbedding erfolgreich erstellt.");
}

main()
  .catch((e) => console.error("❌ Fehler beim Embedding:", e))
  .finally(() => process.exit(0));
