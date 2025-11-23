import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal = "Gewicht halten" } = await req.json();

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

    // 🩺 Korrekte Feldnamen laut neuem Schema
    const avgCalories = average(recent.map((d) => d.calories || 0));
    const avgSteps = average(recent.map((d) => d.steps || 0));
    const avgSleep = average(recent.map((d) => d.sleepHours || 0));
    const avgHeartRate = average(recent.map((d) => d.heartRate || 0));
    const avgSystolic = average(recent.map((d) => d.bloodPressureSystolic || 0));
    const avgDiastolic = average(recent.map((d) => d.bloodPressureDiastolic || 0));

    let alertTriggered = false;
    const alerts: string[] = [];

    if (avgSystolic > 140 || avgDiastolic > 90) {
      alertTriggered = true;
      alerts.push("🩸 Dein Blutdruck war zuletzt zu hoch. Beobachte deine Werte und vermeide Stress, Salz und Alkohol.");
    } else if (avgSystolic < 100 || avgDiastolic < 60) {
      alertTriggered = true;
      alerts.push("🩸 Dein Blutdruck war zuletzt niedrig. Trinke genug Wasser und bewege dich regelmäßig.");
    }

    if (avgHeartRate > 85) {
      alertTriggered = true;
      alerts.push("❤️ Deine Herzfrequenz war zuletzt erhöht. Achte auf Ruhe, Atmung und Stressreduktion.");
    }

    if (avgSteps < 6000) {
      alertTriggered = true;
      alerts.push("🚶‍♂️ Du hattest wenig Bewegung. Versuche, heute mehr Schritte zu machen.");
    }

    if (avgSleep < 6) {
      alertTriggered = true;
      alerts.push("😴 Du schläfst zu wenig. Plane ausreichend Schlafzeit ein.");
    }

    // Ernährung
    if (goal.includes("abnehmen")) {
      if (avgCalories > 2200) {
        alertTriggered = true;
        alerts.push("⚠️ Deine Kalorienaufnahme ist zu hoch für dein Abnehmziel.");
      } else if (avgCalories < 1400) {
        alertTriggered = true;
        alerts.push("🍽️ Deine Kalorienaufnahme ist sehr niedrig. Achte auf eine ausreichende Nährstoffzufuhr.");
      }
    } else if (goal.includes("zunehmen")) {
      if (avgCalories < 2500) {
        alertTriggered = true;
        alerts.push("🍗 Deine Kalorienaufnahme ist zu niedrig für dein Ziel, Gewicht zuzulegen.");
      }
    } else {
      if (avgCalories > 2700) {
        alertTriggered = true;
        alerts.push("⚖️ Deine Kalorienaufnahme war zuletzt etwas hoch. Achte auf Balance.");
      } else if (avgCalories < 1800) {
        alertTriggered = true;
        alerts.push("🥦 Deine Kalorienaufnahme war niedrig. Du könntest etwas mehr Energie brauchen.");
      }
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

    // 🧠 KI-Empfehlung
    const prompt = `
Du bist ein digitaler Gesundheitscoach.
Hier sind aktuelle Auffälligkeiten:
${alerts.join("\n")}

Das Ziel des Nutzers lautet: ${goal}

Erstelle eine kurze, motivierende Empfehlung für heute:
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
