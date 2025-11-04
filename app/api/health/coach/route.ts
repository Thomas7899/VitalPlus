// app/api/health/coach/route.ts

import { NextResponse } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Wichtig: Verhindert Edge-Runtime-Probleme mit OpenAI-Streaming
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // --- Debug: Body prüfen ---
    const bodyText = await req.text();
    console.log("📥 Request Body (raw):", bodyText);

    // Versuche, JSON zu parsen
    let parsed: { userId?: string; goal?: string } = {};
    try {
      parsed = JSON.parse(bodyText);
    } catch (e) {
      console.error("❌ Fehler beim JSON-Parsing:", e);
      return NextResponse.json({ error: "Ungültiges JSON im Request" }, { status: 400 });
    }

    const { userId, goal } = parsed;

    if (!userId) {
      console.error("❌ Kein userId im Request-Body gefunden.");
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

    // --- Datenbankabfragen ---
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
      console.warn("⚠️ Keine Gesundheitsdaten gefunden für userId:", userId);
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

    // --- Testweise: nur Logging & Rückgabe ---
    // 👇 Schritt 1: Nur prüfen, ob alles korrekt ankommt
    console.log("✅ Eingehende Daten korrekt:", { userId, goal, summaryLength: summary.length });

    // Temporär den KI-Teil deaktivieren (Debug)
    return NextResponse.json({
      success: true,
      message: "Request erfolgreich verarbeitet (KI deaktiviert für Test)",
      received: { userId, goal },
      recentCount: recent.length,
    });

    // --- Schritt 2: KI-Teil wieder aktivieren, wenn das funktioniert ---
    /*
    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: `
      Du bist ein digitaler Gesundheitscoach.
      Analysiere Gesundheitsdaten und gib Empfehlungen, Warnungen und einfache Ernährungs- oder Trainingspläne.
      Formatiere deine Antwort in Markdown:
      1. **Zusammenfassung**
      2. **Warnungen**
      3. **Empfehlungen**
      `,
      prompt: `
      Gesundheitsdaten:
      ${summary}

      Ziel des Nutzers: ${goal || "Gesund bleiben"}
      `,
    });

    return result.toTextStreamResponse();
    */
  } catch (error) {
    console.error("💥 Coach-Fehler:", error);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}
