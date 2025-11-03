import OpenAI from "openai";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { queryText } = await req.json();

    if (!queryText) {
      return new Response(
        JSON.stringify({ error: "Missing queryText" }),
        { status: 400 }
      );
    }

    // 🔹 1. Generate embedding from input text
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: queryText,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 🔹 2. Query similar embeddings from Postgres (using Drizzle raw SQL)
    const similarEntries = await db.execute(sql`
      SELECT id, "userId", content
      FROM "HealthEmbedding"
      ORDER BY embedding <-> ${sql.raw(`'[${queryEmbedding.join(",")}]'`)}
      LIMIT 3;
    `);

    // 🔹 3. Combine retrieved context
    const context = (similarEntries.rows ?? [])
      .map((r: any) => r.content)
      .join("\n---\n");

    // 🔹 4. Generate recommendation with GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Du bist ein professioneller Gesundheitsberater.",
        },
        {
          role: "user",
          content: `
Meine aktuelle Situation: ${queryText}

Ähnliche vergangene Gesundheitsdaten:
${context}

Bitte gib mir eine klare, motivierende Empfehlung mit Fokus auf
Ernährung, Bewegung und Erholung.
          `,
        },
      ],
      temperature: 0.8,
    });

    const recommendation = completion.choices[0].message?.content;

    return new Response(
      JSON.stringify({ success: true, recommendation }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Recommendation failed:", error);
    return new Response(
      JSON.stringify({ error: "Recommendation failed" }),
      { status: 500 }
    );
  }
}
