// app/api/health/coach/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { 
  generateCoachAnalysisPrompt, 
  HEALTH_COACH_SYSTEM_PROMPT,
  generateDataAvailabilityContext,
  generateYearTransitionContext,
  generateLowDataFallbackPrompt
} from "@/lib/prompts";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { 
  validateCoachResponse, 
  addMedicalDisclaimer,
  validateHealthGoal 
} from "@/lib/ai-validation";
import { auth } from "@/lib/auth";
import { checkDataAvailability } from "@/lib/data-availability";
import { getYearTransitionInfo } from "@/lib/date-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    // 🔐 Auth prüfen
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, goal: providedGoal, skipCache = false } = body;

    // 🔐 Ownership Check - User kann nur eigene Daten analysieren
    const targetUserId = userId || session.user.id;
    if (userId && userId !== session.user.id) {
      return NextResponse.json(
        { error: "Zugriff verweigert: Sie können nur eigene Daten analysieren" },
        { status: 403 }
      );
    }

    // Rate-Limiting prüfen
    const rateLimit = checkRateLimit(targetUserId, "ai:coach");
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
      const cached = await getCachedResponse<{ sections: unknown[] }>(targetUserId, "coach_analysis");
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
      .where(eq(users.id, targetUserId))
      .limit(1)
      .then((rows) => rows[0]);

    // 🛡️ Goal sanitizen (Prompt Injection Prevention)
    const rawGoal = providedGoal || mapHealthGoalToText(userProfile?.healthGoal, userProfile?.activityLevel);
    const goal = validateHealthGoal(rawGoal);

    // 📅 2026-READINESS: Datenverfügbarkeit prüfen
    const dataAvailability = await checkDataAvailability(targetUserId);
    const yearInfo = getYearTransitionInfo();

    // ⏳ Embedding-Update im Hintergrund (nur wenn genug Daten)
    if (dataAvailability.status !== "none" && dataAvailability.status !== "insufficient") {
      updateHealthEmbeddingForUser(targetUserId).catch((err) =>
        console.warn("⚠️ Embedding update failed:", err)
      );
    }

    // 🔹 Letzte Gesundheitsdaten und vorhandenes Embedding abrufen
    const [recent, embeddingResult] = await Promise.all([
      db
        .select()
        .from(healthData)
        .where(eq(healthData.userId, targetUserId))
        .orderBy(desc(healthData.date))
        .limit(30),
      db
        .select()
        .from(healthEmbeddings)
        .where(eq(healthEmbeddings.userId, targetUserId))
        .limit(1),
    ]);

    // 📊 LOW-DATA HANDLING: Graceful Fallback bei wenig/keinen Daten
    if (dataAvailability.status === "none") {
      // Keine Daten → Allgemeine Empfehlungen
      const lowDataPrompt = generateLowDataFallbackPrompt(goal, yearInfo.isEarlyYear);
      const yearContext = generateYearTransitionContext(
        yearInfo.currentYear, 
        yearInfo.previousYear, 
        yearInfo.daysIntoNewYear
      );
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
        messages: [
          { role: "system", content: HEALTH_COACH_SYSTEM_PROMPT + yearContext },
          { role: "user", content: lowDataPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (content) {
        const validationResult = validateCoachResponse(content);
        if (validationResult.data) {
          return NextResponse.json({
            ...validationResult.data,
            lowDataMode: true,
            dataStatus: dataAvailability.status,
            userMessage: dataAvailability.userMessage,
          });
        }
      }
      
      // Fallback bei Fehler
      return NextResponse.json({
        sections: [{
          title: "Willkommen bei VitalPlus",
          content: dataAvailability.userMessage,
          type: "info"
        }],
        lowDataMode: true,
        dataStatus: "none",
      });
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

    // 📅 2026-READINESS: Kontextualisierter Prompt mit Datenverfügbarkeit
    const dataContext = generateDataAvailabilityContext(
      dataAvailability.status,
      dataAvailability.daysWithData,
      yearInfo.isEarlyYear
    );
    const yearContext = generateYearTransitionContext(
      yearInfo.currentYear,
      yearInfo.previousYear,
      yearInfo.daysIntoNewYear
    );

    // 🧠 OpenAI-Analyse mit zentralisiertem Prompt
    const userPrompt = generateCoachAnalysisPrompt(summary, goal);
    
    // System-Prompt mit Kontext erweitern
    const enhancedSystemPrompt = [
      HEALTH_COACH_SYSTEM_PROMPT,
      dataContext,
      yearContext,
      dataAvailability.aiContext,
    ].filter(Boolean).join("\n\n");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: enhancedSystemPrompt,
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

    // 🛡️ Validiere AI Output mit Zod
    const validationResult = validateCoachResponse(content);
    
    if (!validationResult.success && !validationResult.data) {
      console.error("AI response validation failed completely");
      return NextResponse.json({ error: "AI-Antwort ungültig" }, { status: 502 });
    }

    // 🏥 Füge medizinischen Disclaimer hinzu wenn nötig
    const finalResponse = addMedicalDisclaimer(validationResult.data!);

    // Ergebnis cachen
    await setCachedResponse(targetUserId, "coach_analysis", finalResponse);

    // 📊 Response mit Datenstatus anreichern
    return NextResponse.json({
      ...finalResponse,
      dataStatus: dataAvailability.status,
      lowDataMode: dataAvailability.status === "insufficient" || dataAvailability.status === "limited",
    }, { status: 200 });
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