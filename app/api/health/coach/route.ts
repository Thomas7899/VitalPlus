// app/api/health/coach/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";

export const runtime = "nodejs";
export const maxDuration = 60; // ⏱️ Erhöht Timeout auf 60s

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, goal = "Gesund bleiben" } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

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
      embeddingPromise, // ⏱️ wird im Hintergrund fertig
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

    // 🧠 OpenAI-Analyse
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `
Du bist ein digitaler Gesundheitscoach. Analysiere die Gesundheitsdaten
und gib deine Antwort IMMER als valides JSON-Objekt zurück.

Das Objekt soll so aussehen:
{
  "sections": [
    { "title": string, "content": string, "type": "summary" | "warning" | "nutrition" | "training" | "sleep" | "info" }
  ]
}
          `,
        },
        {
          role: "user",
          content: `Hier sind die Gesundheitsdaten:\n${summary}\n\nZiel des Nutzers: ${goal}`,
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

    return NextResponse.json(parsedJson, { status: 200 });
  } catch (error) {
    console.error("💥 Coach-Fehler:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
