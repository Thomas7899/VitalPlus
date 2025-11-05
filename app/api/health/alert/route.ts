// app/api/health/alert/route.ts
import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    const recent = await db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.date))
      .limit(7);

    if (recent.length === 0) {
      return new Response(JSON.stringify({ error: "No recent data" }), { status: 404 });
    }

    const avgCalories = average(recent.map((d) => d.calories || 0));
    const avgSteps = average(recent.map((d) => d.steps || 0));
    const avgSleep = average(recent.map((d) => d.sleepHours || 0));
    const avgHeartRate = average(recent.map((d) => d.heartRate || 0));

    let alertTriggered = false;
    const alerts: string[] = [];

    if (avgCalories > 2500) {
      alertTriggered = true;
      alerts.push("⚠️ Deine Kalorienaufnahme war in den letzten Tagen überdurchschnittlich hoch.");
    }
    if (avgSteps < 6000) {
      alertTriggered = true;
      alerts.push("🚶‍♂️ Du hattest wenig Bewegung. Versuche, heute mehr Schritte zu machen.");
    }
    if (avgSleep < 6) {
      alertTriggered = true;
      alerts.push("😴 Du schläfst zu wenig. Achte auf ausreichend Erholung.");
    }
    if (avgHeartRate > 85) {
      alertTriggered = true;
      alerts.push("❤️ Deine Herzfrequenz war zuletzt erhöht. Vermeide Stress und trinke genug Wasser.");
    }

    if (!alertTriggered) {
      return new Response(
        JSON.stringify({
          success: true,
          alerts: [],
          message: "Keine Auffälligkeiten erkannt.",
        }),
        { status: 200 }
      );
    }

    await updateHealthEmbeddingForUser(userId);

    const prompt = `
Du bist ein digitaler Gesundheitscoach. Hier sind aktuelle Auffälligkeiten:
${alerts.join("\n")}

Erstelle eine kurze, positive Reaktion mit Empfehlungen für heute:
- Was sollte der Nutzer essen?
- Wie könnte er sich bewegen?
- Wie kann er sich erholen?
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein freundlicher Gesundheitscoach." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const recommendation = completion.choices[0].message?.content ?? "Keine Empfehlung generiert.";

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        recommendation,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Health alert generation failed:", error);
    return new Response(
      JSON.stringify({ error: "Health alert generation failed" }),
      { status: 500 }
    );
  }
}

function average(nums: number[]): number {
  const valid = nums.filter((n) => n > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}
