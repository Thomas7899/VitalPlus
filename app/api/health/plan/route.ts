// app/api/health/plan/route.ts
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { NextResponse } from "next/server";
import { generateDailyPlanPrompt, HEALTH_COACH_SYSTEM_PROMPT } from "@/lib/prompts";
import { getCachedResponse, setCachedResponse } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal: providedGoal, skipCache = false } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Rate-Limiting prüfen
    const rateLimit = checkRateLimit(userId, "ai:plan");
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
      const cached = await getCachedResponse<{ plan: string }>(userId, "daily_plan");
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
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    // Ziel aus Profil verwenden, falls nicht explizit angegeben
    const goal = providedGoal || mapHealthGoalToText(userProfile?.healthGoal, userProfile?.activityLevel);

    updateHealthEmbeddingForUser(userId).catch((err) =>
      console.warn("⚠️ Embedding update failed:", err)
    );

    const [embeddingEntry, recentData] = await Promise.all([
      db
        .select()
        .from(healthEmbeddings)
        .where(eq(healthEmbeddings.userId, userId))
        .limit(1)
        .then((rows) => rows[0]),
      db
        .select()
        .from(healthData)
        .where(eq(healthData.userId, userId))
        .orderBy(desc(healthData.date))
        .limit(7),
    ]);

    if (recentData.length === 0) {
      return NextResponse.json({ error: "No health data found" }, { status: 404 });
    }

    const avgCalories = average(recentData.map((d) => d.calories ?? 0));
    const avgSteps = average(recentData.map((d) => d.steps ?? 0));
    const avgWeight = average(recentData.map((d) => d.weight ?? 0));

    const context = embeddingEntry?.content || "Keine erweiterten Gesundheitsdaten verfügbar.";

    // Prompt-Generierung ausgelagert
    const prompt = generateDailyPlanPrompt({
      calories: avgCalories,
      steps: avgSteps,
      weight: avgWeight,
      goal,
      context
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: HEALTH_COACH_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const result = completion.choices[0].message?.content?.trim();

    if (!result) {
      return NextResponse.json({ error: "Keine Antwort von KI" }, { status: 502 });
    }

    let plan;
    try {
      plan = JSON.parse(result);
    } catch {
      plan = { summary: result };
    }

    const nutritionList = Array.isArray(plan.nutrition)
      ? plan.nutrition.map((m: any) => `- **${m.meal}:** ${m.content}`).join("\n")
      : "- Keine spezifischen Empfehlungen verfügbar";

    const markdownPlan = `
### 🩺 ${plan.summary || "Dein persönlicher Tagesplan"}

**🍽 Ernährung**
${nutritionList}

**💪 Training:** ${plan.training || "Moderate Bewegung empfohlen"}

**💬 Motivation:** ${plan.motivation || "Du schaffst das!"}
`;

    // Ergebnis cachen
    await setCachedResponse(userId, "daily_plan", { plan: markdownPlan });

    return NextResponse.json({ plan: markdownPlan }, { status: 200 });
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