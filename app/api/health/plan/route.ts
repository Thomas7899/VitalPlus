// app/api/health/plan/route.ts
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { NextResponse } from "next/server";
import { generateDailyPlanPrompt, HEALTH_COACH_SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal = "Gewicht halten und gesund ernähren" } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

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
        { role: "system", content: HEALTH_COACH_SYSTEM_PROMPT }, // Zentraler System-Prompt
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

    const markdownPlan = `
### 🩺 ${plan.summary}

**🍽 Ernährung**
${plan.nutrition?.map((m: any) => `- **${m.meal}:** ${m.content}`).join("\n")}

**💪 Training:** ${plan.training}

**💬 Motivation:** ${plan.motivation}
`;

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