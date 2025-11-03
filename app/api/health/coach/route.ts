import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

    const recent = await db
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
      .limit(30);

    if (recent.length === 0) {
      return NextResponse.json({ error: "Keine Gesundheitsdaten gefunden" }, { status: 404 });
    }

    const [embeddingEntry] = await db
      .select()
      .from(healthEmbeddings)
      .where(eq(healthEmbeddings.userId, userId))
      .limit(1);

    const summary =
      embeddingEntry?.content ||
      recent
        .map(
          (d) =>
            `Datum ${d.date.toISOString().split("T")[0]}: ${d.steps ?? 0} Schritte, Puls ${d.heartRate ?? "?"}, Schlaf ${d.sleepHours ?? "?"}h, Gewicht ${d.weight ?? "?"}kg`
        )
        .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Du bist ein digitaler Gesundheitscoach. 
Analysiere Gesundheitsdaten und erstelle Empfehlungen, Warnungen und einfache Ernährungs- oder Trainingspläne.
Gib die Antwort als JSON im Format:
{
  "summary": "...",
  "warnings": ["..."],
  "recommendations": {
    "nutrition": "...",
    "training": "...",
    "recovery": "..."
  }
}
          `,
        },
        {
          role: "user",
          content: `
Gesundheitsdaten:
${summary}

Ziel des Nutzers: ${goal || "Gesund bleiben"}

Bitte analysiere diese Daten und gib strukturierte Empfehlungen.
          `,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message?.content ?? "{}");

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Coach-Fehler:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
