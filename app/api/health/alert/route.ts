// app/api/health/alert/route.ts
import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { NextResponse } from "next/server";

import { generateAlertAnalysisPrompt, HEALTH_COACH_SYSTEM_PROMPT } from "@/lib/prompts";

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal = "Gewicht halten" } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const recent = await db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.date))
      .limit(7);

    if (recent.length === 0) {
      return NextResponse.json({ error: "No recent data" }, { status: 404 });
    }

    const avgCalories = average(recent.map((d) => d.calories || 0));
    const avgSteps = average(recent.map((d) => d.steps || 0));
    const avgSleep = average(recent.map((d) => d.sleepHours || 0));
    const avgHeartRate = average(recent.map((d) => d.heartRate || 0));
    const avgSystolic = average(recent.map((d) => d.bloodPressureSystolic || 0));
    const avgDiastolic = average(recent.map((d) => d.bloodPressureDiastolic || 0));

    let alertTriggered = false;
    const alerts: string[] = [];

    // --- Alert Logik ---
    if (avgSystolic > 140 || avgDiastolic > 90) {
      alertTriggered = true;
      alerts.push("🩸 Dein Blutdruck war zuletzt zu hoch. Beobachte deine Werte und vermeide Stress.");
    } else if (avgSystolic < 100 && avgSystolic > 0) {
      alertTriggered = true;
      alerts.push("🩸 Dein Blutdruck war zuletzt niedrig. Trinke genug Wasser.");
    }

    if (avgHeartRate > 85) {
      alertTriggered = true;
      alerts.push("❤️ Deine Herzfrequenz war zuletzt erhöht. Achte auf Erholung.");
    }

    if (avgSteps < 4000 && avgSteps > 0) {
      alertTriggered = true;
      alerts.push("🚶‍♂️ Du hattest sehr wenig Bewegung. Ein Spaziergang würde gut tun.");
    }

    if (avgSleep < 6 && avgSleep > 0) {
      alertTriggered = true;
      alerts.push("😴 Du schläfst zu wenig. Versuche früher ins Bett zu gehen.");
    }

    // Einfache Ernährungs-Logik
    if (goal.includes("abnehmen")) {
      if (avgCalories > 2500) {
        alertTriggered = true;
        alerts.push("⚠️ Deine Kalorienaufnahme liegt über deinem Zielbereich.");
      }
    }

    // Fall: Keine Alerts
    if (!alertTriggered) {
      return NextResponse.json(
        {
          success: true,
          alerts: [],
          message: "Keine Auffälligkeiten erkannt.",
        },
        { status: 200 }
      );
    }

    await updateHealthEmbeddingForUser(userId).catch(err => 
      console.warn("Background Embedding Update failed:", err)
    );

    // Prompt generieren (ausgelagert)
    const prompt = generateAlertAnalysisPrompt(alerts, goal);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: HEALTH_COACH_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const recommendation = completion.choices[0].message?.content ?? "Keine Empfehlung generiert.";

    return NextResponse.json(
      {
        success: true,
        alerts,
        recommendation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health alert generation failed:", error);
    return NextResponse.json({ error: "Health alert generation failed" }, { status: 500 });
  }
}

function average(nums: number[]): number {
  const valid = nums.filter((n) => n > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}