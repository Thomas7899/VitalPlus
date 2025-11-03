import "dotenv/config";
import { db } from "./client";
import { healthEmbeddings } from "./schema";
import { generateEmbedding } from "../lib/embeddings";

const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1";

async function main() {
  console.log("Erzeuge HealthEmbedding...");

  const content = `
    John Doe, männlich, 35 Jahre, 1.75m groß.
    Durchschnittlich 10.000 Schritte pro Tag,
    Herzfrequenz zwischen 60–80 bpm,
    Schlafdauer 6–8 Stunden,
    Gewicht ca. 75 kg.
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
  .catch(console.error)
  .finally(() => process.exit(0));
