// app/api/health/alert/route.ts
import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { NextResponse } from "next/server";
import { generateAlertAnalysisPrompt, HEALTH_COACH_SYSTEM_PROMPT } from "@/lib/prompts";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { saveAlerts, getUserAlertThresholds, AlertType, AlertSeverity } from "@/lib/alert-history";

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

interface AlertInfo {
  message: string;
  type: AlertType;
  severity: AlertSeverity;
  value: number;
  threshold: number;
}

export async function POST(req: Request) {
  try {
    const { userId, goal = "Gewicht halten", skipCache = false } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Rate-Limiting prüfen
    const rateLimit = checkRateLimit(userId, "ai:alert");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Zu viele Anfragen. Bitte warte einen Moment.",
          retryAfter: Math.ceil((rateLimit.retryAfterMs || 60000) / 1000),
        },
        { status: 429 }
      );
    }

    // Cache prüfen (außer wenn explizit übersprungen)
    if (!skipCache) {
      const cached = await getCachedResponse<{ alerts: string[]; recommendation: string | null }>(
        userId,
        "alerts"
      );
      if (cached) {
        return NextResponse.json({
          success: true,
          alerts: cached.alerts,
          recommendation: cached.recommendation,
          fromCache: true,
        });
      }
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

    // Personalisierte Grenzwerte laden
    const thresholds = await getUserAlertThresholds(userId);

    const avgCalories = average(recent.map((d) => d.calories || 0));
    const avgSteps = average(recent.map((d) => d.steps || 0));
    const avgSleep = average(recent.map((d) => d.sleepHours || 0));
    const avgHeartRate = average(recent.map((d) => d.heartRate || 0));
    const avgSystolic = average(recent.map((d) => d.bloodPressureSystolic || 0));
    const avgDiastolic = average(recent.map((d) => d.bloodPressureDiastolic || 0));
    const avgOxygen = average(recent.map((d) => d.oxygenSaturation || 0));

    const alertInfos: AlertInfo[] = [];

    // --- Alert Logik mit personalisierten Grenzwerten ---
    if (avgSystolic > thresholds.maxSystolic || avgDiastolic > thresholds.maxDiastolic) {
      alertInfos.push({
        message: "🩸 Dein Blutdruck war zuletzt zu hoch. Beobachte deine Werte und vermeide Stress.",
        type: "blood_pressure_high",
        severity: avgSystolic > 160 ? "critical" : "warning",
        value: avgSystolic,
        threshold: thresholds.maxSystolic,
      });
    } else if (avgSystolic < 100 && avgSystolic > 0) {
      alertInfos.push({
        message: "🩸 Dein Blutdruck war zuletzt niedrig. Trinke genug Wasser.",
        type: "blood_pressure_low",
        severity: "warning",
        value: avgSystolic,
        threshold: 100,
      });
    }

    if (avgHeartRate > thresholds.maxHeartRate) {
      alertInfos.push({
        message: "❤️ Deine Herzfrequenz war zuletzt erhöht. Achte auf Erholung.",
        type: "heart_rate_high",
        severity: avgHeartRate > 100 ? "critical" : "warning",
        value: avgHeartRate,
        threshold: thresholds.maxHeartRate,
      });
    } else if (avgHeartRate < thresholds.minHeartRate && avgHeartRate > 0) {
      alertInfos.push({
        message: "❤️ Deine Herzfrequenz war zuletzt sehr niedrig. Bei anhaltenden Beschwerden einen Arzt aufsuchen.",
        type: "heart_rate_low",
        severity: avgHeartRate < 40 ? "critical" : "warning",
        value: avgHeartRate,
        threshold: thresholds.minHeartRate,
      });
    }

    if (avgOxygen < thresholds.minOxygen && avgOxygen > 0) {
      alertInfos.push({
        message: "🫁 Deine Sauerstoffsättigung war unter 95%. Achte auf tiefe Atemübungen.",
        type: "oxygen_low",
        severity: avgOxygen < 90 ? "critical" : "warning",
        value: avgOxygen,
        threshold: thresholds.minOxygen,
      });
    }

    if (avgSteps < thresholds.minSteps && avgSteps > 0) {
      alertInfos.push({
        message: "🚶‍♂️ Du hattest sehr wenig Bewegung. Ein Spaziergang würde gut tun.",
        type: "steps_low",
        severity: "warning",
        value: avgSteps,
        threshold: thresholds.minSteps,
      });
    }

    if (avgSleep < thresholds.minSleep && avgSleep > 0) {
      alertInfos.push({
        message: "😴 Du schläfst zu wenig. Versuche früher ins Bett zu gehen.",
        type: "sleep_low",
        severity: avgSleep < 4 ? "critical" : "warning",
        value: avgSleep,
        threshold: thresholds.minSleep,
      });
    }

    // Kalorien-Logik (personalisiert)
    if (avgCalories > thresholds.maxCalories && avgCalories > 0) {
      alertInfos.push({
        message: "⚠️ Deine Kalorienaufnahme liegt über deinem Zielbereich.",
        type: "calories_high",
        severity: "warning",
        value: avgCalories,
        threshold: thresholds.maxCalories,
      });
    }

    // Fall: Keine Alerts
    if (alertInfos.length === 0) {
      const result = {
        success: true,
        alerts: [],
        recommendation: null,
        message: "Keine Auffälligkeiten erkannt.",
      };
      await setCachedResponse(userId, "alerts", { alerts: [], recommendation: null });
      return NextResponse.json(result, { status: 200 });
    }

    // Alerts in History speichern
    await saveAlerts(
      alertInfos.map((a) => ({
        userId,
        alertType: a.type,
        severity: a.severity,
        message: a.message,
        value: a.value,
        threshold: a.threshold,
      }))
    );

    await updateHealthEmbeddingForUser(userId).catch(err => 
      console.warn("Background Embedding Update failed:", err)
    );

    const alerts = alertInfos.map((a) => a.message);
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

    // Ergebnis cachen
    await setCachedResponse(userId, "alerts", { alerts, recommendation });

    return NextResponse.json(
      {
        success: true,
        alerts,
        recommendation,
        thresholds, // Grenzwerte mit zurückgeben für Transparenz
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