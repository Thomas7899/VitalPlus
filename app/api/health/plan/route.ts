// app/api/health/plan/route.ts
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { NextResponse } from "next/server";
import { 
  generateDailyPlanPrompt, 
  HEALTH_COACH_SYSTEM_PROMPT,
  generateDataAvailabilityContext,
  generateYearTransitionContext,
  generateLowDataFallbackPrompt
} from "@/lib/prompts";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { validateDailyPlanResponse, validateHealthGoal } from "@/lib/ai-validation";
import { checkDataAvailability, getHealthBaseline } from "@/lib/data-availability";
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

    // 🔐 Ownership Check
    const targetUserId = userId || session.user.id;
    if (userId && userId !== session.user.id) {
      return NextResponse.json(
        { error: "Zugriff verweigert: Sie können nur eigene Daten analysieren" },
        { status: 403 }
      );
    }

    // Rate-Limiting prüfen
    const rateLimit = checkRateLimit(targetUserId, "ai:plan");
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
      const cached = await getCachedResponse<{ plan: string }>(targetUserId, "daily_plan");
      if (cached) {
        return NextResponse.json({ plan: cached.plan, fromCache: true });
      }
    }

    // Benutzerprofil laden für personalisiertes Ziel
    const userProfile = await db
      .select({
        healthGoal: users.healthGoal,
        activityLevel: users.activityLevel,
        targetWeight: users.targetWeight,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)
      .then((rows) => rows[0]);

    // 🛡️ Goal sanitizen
    const rawGoal = providedGoal || mapHealthGoalToText(userProfile?.healthGoal, userProfile?.activityLevel);
    const goal = validateHealthGoal(rawGoal);

    // 📅 2026-READINESS: Datenverfügbarkeit prüfen
    const dataAvailability = await checkDataAvailability(targetUserId);
    const yearInfo = getYearTransitionInfo();

    // Embedding nur aktualisieren wenn genug Daten
    if (dataAvailability.status !== "none" && dataAvailability.status !== "insufficient") {
      updateHealthEmbeddingForUser(targetUserId).catch((err) =>
        console.warn("⚠️ Embedding update failed:", err)
      );
    }

    const [embeddingEntry, recentData] = await Promise.all([
      db
        .select()
        .from(healthEmbeddings)
        .where(eq(healthEmbeddings.userId, targetUserId))
        .limit(1)
        .then((rows) => rows[0]),
      db
        .select()
        .from(healthData)
        .where(eq(healthData.userId, targetUserId))
        .orderBy(desc(healthData.date))
        .limit(7),
    ]);

    // 📊 LOW-DATA HANDLING: Nutze Baseline bei fehlenden Daten
    let avgCalories: number;
    let avgSteps: number;
    let avgWeight: number;
    let lowDataMode = false;

    if (recentData.length === 0 || dataAvailability.status === "none") {
      // Keine Daten → Nutze Baseline (evtl. aus Vorjahr oder Defaults)
      const baseline = await getHealthBaseline(targetUserId);
      avgCalories = 2000; // Standard für Plan-Erstellung
      avgSteps = baseline.steps || 8000;
      avgWeight = baseline.weight || 70;
      lowDataMode = true;
    } else {
      avgCalories = average(recentData.map((d) => d.calories ?? 0)) || 2000;
      avgSteps = average(recentData.map((d) => d.steps ?? 0)) || 8000;
      avgWeight = average(recentData.map((d) => d.weight ?? 0)) || 70;
      lowDataMode = dataAvailability.status === "insufficient";
    }

    const context = embeddingEntry?.content || "Keine erweiterten Gesundheitsdaten verfügbar.";

    // 📅 2026-READINESS: Kontextualisierter Prompt
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

    // Prompt-Generierung 
    const prompt = lowDataMode 
      ? generateLowDataFallbackPrompt(goal, yearInfo.isEarlyYear) + `\n\n## Baseline-Daten:\n- Kalorien: ${avgCalories} kcal\n- Schritte: ${avgSteps}\n- Gewicht: ${avgWeight} kg`
      : generateDailyPlanPrompt({
          calories: avgCalories,
          steps: avgSteps,
          weight: avgWeight,
          goal,
          context
        });

    const enhancedSystemPrompt = [
      HEALTH_COACH_SYSTEM_PROMPT,
      dataContext,
      yearContext,
    ].filter(Boolean).join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: enhancedSystemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const result = completion.choices[0].message?.content?.trim();

    if (!result) {
      return NextResponse.json({ error: "Keine Antwort von KI" }, { status: 502 });
    }

    // 🛡️ Validiere AI Output
    const validationResult = validateDailyPlanResponse(result);
    const plan = validationResult.data!;

    const nutritionList = Array.isArray(plan.nutrition)
      ? plan.nutrition.map((m) => `- **${m.meal}:** ${m.content}`).join("\n")
      : "- Keine spezifischen Empfehlungen verfügbar";

    const markdownPlan = `
### 🩺 ${plan.summary || "Dein persönlicher Tagesplan"}

**🍽 Ernährung**
${nutritionList}

**💪 Training:** ${plan.training || "Moderate Bewegung empfohlen"}

**💬 Motivation:** ${plan.motivation || "Du schaffst das!"}
${lowDataMode ? "\n---\n*📊 Hinweis: Dieser Plan basiert auf allgemeinen Empfehlungen. Erfasse mehr Daten für personalisierte Vorschläge.*" : ""}
`;

    // Ergebnis cachen
    await setCachedResponse(targetUserId, "daily_plan", { plan: markdownPlan });

    return NextResponse.json({ 
      plan: markdownPlan,
      lowDataMode,
      dataStatus: dataAvailability.status,
    }, { status: 200 });
  } catch (error) {
    console.error("💥 Fehler bei der Planerstellung:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}

function average(nums: number[]): number {
  const valid = nums.filter((n) => n > 0);
  if (valid.length === 0) return 0;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

function mapHealthGoalToText(
  healthGoal: string | null | undefined,
  activityLevel: string | null | undefined
): string {
  const goalTexts: Record<string, string> = {
    abnehmen: "Gewicht reduzieren und Fett verbrennen",
    zunehmen: "Gesund zunehmen und Masse aufbauen",
    muskelaufbau: "Muskeln aufbauen und stärker werden",
    gesund_bleiben: "Gesund und fit bleiben",
  };

  const activityTexts: Record<string, string> = {
    sedentary: "trotz wenig Bewegung im Alltag",
    normal: "mit moderater Aktivität",
    active: "mit regelmäßigem Training",
    athlete: "als Sportler mit intensivem Training",
  };

  const goalText = goalTexts[healthGoal || "gesund_bleiben"] || "Gesund bleiben";
  const activityText = activityTexts[activityLevel || "normal"] || "";

  return activityText ? `${goalText} ${activityText}` : goalText;
}