// app/api/health/plan/route.ts
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal = "Gewicht halten und gesund ernähren" } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    // 🧩 Embedding aktualisieren
    await updateHealthEmbeddingForUser(userId);

    // 🔹 Embedding aus DB holen
    const [embeddingEntry] = await db
      .select()
      .from(healthEmbeddings)
      .where(eq(healthEmbeddings.userId, userId))
      .limit(1);

    const recentData = await db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.date))
      .limit(7);

    if (recentData.length === 0) {
      return new Response(JSON.stringify({ error: "No health data found" }), { status: 404 });
    }

    const avgCalories = average(recentData.map((d) => d.calories || 0));
    const avgSteps = average(recentData.map((d) => d.steps || 0));
    const avgWeight = average(recentData.map((d) => d.weight || 0));

    const context = embeddingEntry?.content || "Keine erweiterten Gesundheitsdaten verfügbar.";

    const prompt = `
Du bist ein digitaler Ernährungs- und Fitnesscoach.
Hier ist eine Zusammenfassung des Nutzers:

${context}

Analysiere die letzten 7 Tage des Nutzers und erstelle für heute einen Vorschlag.

Daten:
- Durchschnittliche Kalorienaufnahme: ${avgCalories} kcal
- Durchschnittliche Schritte: ${avgSteps}
- Durchschnittliches Gewicht: ${avgWeight} kg

Ziel: ${goal}

Erstelle:
1. Eine kurze Zusammenfassung der Situation
2. Einen Ernährungsplan für heute (Frühstück, Mittag, Abendessen, Snacks)
3. Einen Trainingsplan (z. B. Bewegung, Spazieren, Krafttraining)
4. Eine Motivation zum Abschluss
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein präziser Gesundheitscoach." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const plan = completion.choices[0].message?.content ?? "Keine Empfehlung generiert.";

    return new Response(JSON.stringify({ success: true, plan }), { status: 200 });
  } catch (error) {
    console.error("Fehler bei der Planerstellung:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate plan" }),
      { status: 500 }
    );
  }
}

function average(nums: number[]): number {
  const valid = nums.filter((n) => n > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}
