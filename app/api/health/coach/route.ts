// app/api/health/coach/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, goal } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

    const [recent, embeddingResult] = await Promise.all([
      db
        .select()
        .from(healthData)
        .where(
          eq(
            healthData.userId,
            process.env.NODE_ENV === "development"
              ? "2fbb9c24-cdf8-49db-9b74-0762017445a1"
              : userId
          )
        )
        .orderBy(desc(healthData.date))
        .limit(30),
      db
        .select()
        .from(healthEmbeddings)
        .where(eq(healthEmbeddings.userId, userId))
        .limit(1),
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
            `Datum ${d.date.toISOString().split("T")[0]}: ${
              d.steps ?? 0
            } Schritte, Puls ${d.heartRate ?? "?"}, Schlaf ${
              d.sleepHours ?? "?"
            }h, Gewicht ${d.weight ?? "?"}kg`
        )
        .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Du bist ein digitaler Gesundheitscoach. Analysiere Gesundheitsdaten und gib Empfehlungen, Warnungen und einfache Ernährungs- oder Trainingspläne. Formatiere deine Antwort in Markdown: 1. **Zusammenfassung** 2. **Warnungen** 3. **Empfehlungen**",
        },
        {
          role: "user",
          content: `Gesundheitsdaten:\n${summary}\n\nZiel des Nutzers: ${
            goal || "Gesund bleiben"
          }`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "Keine Antwort";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("💥 Coach-Fehler:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
