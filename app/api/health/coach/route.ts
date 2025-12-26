// app/api/health/coach/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { generateCoachAnalysisPrompt, HEALTH_COACH_SYSTEM_PROMPT } from "@/lib/prompts";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal: providedGoal, skipCache = false } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

    // Rate-Limiting prüfen
    const rateLimit = checkRateLimit(userId, "ai:coach");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Zu viele Anfragen. Bitte warte einen Moment.",
          retryAfter: Math.ceil((rateLimit.retryAfterMs || 60000) / 1000),
        },
        { status: 429 }
      );
    }

    // Cache prüfen
    if (!skipCache) {
      const cached = await getCachedResponse<{ sections: any[] }>(userId, "coach_analysis");
      if (cached) {
        return NextResponse.json({ ...cached, fromCache: true });
      }
    }

    // Benutzerprofil laden für personalisiertes Ziel
    const userProfile = await db
      .select({
        name: users.name,
        healthGoal: users.healthGoal,
        activityLevel: users.activityLevel,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    const goal = providedGoal || mapHealthGoalToText(userProfile?.healthGoal, userProfile?.activityLevel);

    // ⏳ Embedding-Update parallelisieren
    const embeddingPromise = updateHealthEmbeddingForUser(userId);

    // 🔹 Letzte Gesundheitsdaten und vorhandenes Embedding abrufen
    const [recent, embeddingResult] = await Promise.all([
      db
        .select()
        .from(healthData)
        .where(eq(healthData.userId, userId))
        .orderBy(desc(healthData.date))
        .limit(30),
      db
        .select()
        .from(healthEmbeddings)
        .where(eq(healthEmbeddings.userId, userId))
        .limit(1),
      embeddingPromise,
    ]);

    if (recent.length === 0) {
      return NextResponse.json(
        { error: "Keine Gesundheitsdaten gefunden" },
        { status: 404 }
      );
    }

    const embeddingEntry = embeddingResult[0];
    const summary =
      embeddingEntry?.content ||
      recent
        .map(
          (d) =>
            `📅 ${d.date.toISOString().split("T")[0]} — Schritte: ${
              d.steps ?? 0
            }, Puls: ${d.heartRate ?? "?"}, Schlaf: ${d.sleepHours ?? "?"}h, Gewicht: ${d.weight ?? "?"}kg`
        )
        .join("\n");

    // 🧠 OpenAI-Analyse mit zentralisiertem Prompt
    const userPrompt = generateCoachAnalysisPrompt(summary, goal);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: HEALTH_COACH_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "Keine Antwort von der KI" }, { status: 502 });
    }

    let parsedJson;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      parsedJson = { sections: [{ title: "Fehler", content, type: "info" }] };
    }

    // Ergebnis cachen
    await setCachedResponse(userId, "coach_analysis", parsedJson);

    return NextResponse.json(parsedJson, { status: 200 });
  } catch (error) {
    console.error("💥 Coach-Fehler:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

function mapHealthGoalToText(
  healthGoal: string | null | undefined,
  activityLevel: string | null | undefined
): string {
  const goalTexts: Record<string, string> = {
    abnehmen: "Gewicht reduzieren",
    zunehmen: "Gesund zunehmen",
    muskelaufbau: "Muskeln aufbauen",
    gesund_bleiben: "Gesund und fit bleiben",
  };

  const activityTexts: Record<string, string> = {
    sedentary: "mit wenig Bewegung",
    normal: "mit moderater Aktivität",
    active: "mit regelmäßigem Training",
    athlete: "als Leistungssportler",
  };

  const goalText = goalTexts[healthGoal || "gesund_bleiben"] || "Gesund bleiben";
  const activityText = activityTexts[activityLevel || "normal"] || "";

  return activityText ? `${goalText} ${activityText}` : goalText;
}