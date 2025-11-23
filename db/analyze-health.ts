// db/analyze-health.ts
import { auth } from "@/auth"; 
import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Nicht authentifiziert", { status: 401 });
  }

  // Hole die letzten 30 Tage HealthData für diesen Nutzer
  const data = await db
    .select()
    .from(healthData)
    .where(eq(healthData.userId, userId))
    .orderBy(healthData.date)
    .limit(30);

  if (data.length === 0) {
    return new Response("Keine Health-Daten gefunden", { status: 404 });
  }

  const summary = {
    avgSteps: average(data.map((d) => d.steps || 0)),
    avgSleep: average(data.map((d) => d.sleepHours || 0)),
    avgHeartRate: average(data.map((d) => d.heartRate || 0)),
    avgWeight: average(data.map((d) => d.weight || 0)),
  };

  const prompt = `
    Analysiere die Gesundheitsdaten des Nutzers basierend auf:
    - Durchschnittliche Schritte: ${summary.avgSteps}
    - Durchschnittliche Schlafstunden: ${summary.avgSleep}
    - Durchschnittliche Herzfrequenz: ${summary.avgHeartRate}
    - Durchschnittliches Gewicht: ${summary.avgWeight}

    Gib eine kurze Einschätzung des Gesundheitszustands
    und drei konkrete Empfehlungen (keine medizinische Beratung).
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Du bist ein freundlicher Gesundheitscoach." },
      { role: "user", content: prompt },
    ],
  });

  const result = {
    summary,
    analysis: response.choices[0].message.content,
  };

  return Response.json(result);
}

function average(nums: number[]) {
  const filtered = nums.filter((n) => n > 0);
  return (filtered.reduce((a, b) => a + b, 0) / filtered.length).toFixed(1);
}
