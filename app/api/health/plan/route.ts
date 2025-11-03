import OpenAI from "openai";
import { db } from "@/db/client";
import { healthData, healthEmbeddings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        { status: 400 }
      );
    }

    // 🔹 1. Hole die letzten 7 Gesundheitsdatensätze
    const recentData = await db
      .select()
      .from(healthData)
      .where(eq(healthData.userId, userId))
      .orderBy(desc(healthData.date))
      .limit(7);

    if (recentData.length === 0) {
      return new Response(
        JSON.stringify({ error: "No health data found" }),
        { status: 404 }
      );
    }

    // 🔹 2. Hole vorhandenes Embedding (oder generiere Text)
    const [embeddingEntry] = await db
      .select()
      .from(healthEmbeddings)
      .where(eq(healthEmbeddings.userId, userId))
      .limit(1);

    const healthSummary =
      embeddingEntry?.content ||
      recentData
        .map(
          (d) =>
            `Datum ${d.date?.toISOString().split("T")[0]}: ${d.steps ?? 0} Schritte, Puls ${d.heartRate ?? "?"}, Schlaf ${d.sleepHours ?? "?"}h, Gewicht ${d.weight ?? "?"}kg`
        )
        .join("\n");

    // 🔹 3. Anfrage an OpenAI
    const prompt = `
Du bist ein digitaler Gesundheitscoach.
Analysiere folgende Gesundheitsdaten und gib eine klare, motivierende Empfehlung für die kommende Woche:
${healthSummary}

Erstelle:
- eine kurze Zusammenfassung der letzten Woche
- 3 konkrete Verbesserungsvorschläge (z. B. Ernährung, Bewegung, Schlaf)
- eine Motivation zum Abschluss.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein professioneller Gesundheitsberater." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    });

    const plan = completion.choices[0].message?.content ?? "Keine Empfehlung generiert.";

    // 🔹 4. (Optional) Speichern des Plans in der DB, falls du willst
    // await db
    //   .update(users)
    //   .set({ lastHealthPlan: plan })
    //   .where(eq(users.id, userId));

    // 🔹 5. Antwort zurückgeben
    return new Response(JSON.stringify({ success: true, plan }), { status: 200 });
  } catch (error) {
    console.error("Fehler bei der Planerstellung:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate plan" }),
      { status: 500 }
    );
  }
}
