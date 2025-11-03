import OpenAI from "openai";
import { db } from "@/db/client";
import { healthEmbeddings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId, text } = await req.json();

    if (!userId || !text) {
      return new Response(
        JSON.stringify({ error: "Missing userId or text" }),
        { status: 400 }
      );
    }

    // 🧠 1. Embedding mit OpenAI erzeugen
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = embeddingResponse.data[0].embedding; // number[]

    // 🧩 2. Upsert mit Drizzle (falls schon vorhanden, update)
    const existing = await db
      .select()
      .from(healthEmbeddings)
      .where(eq(healthEmbeddings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // 🔄 Update bestehenden Eintrag
      await db
        .update(healthEmbeddings)
        .set({
          content: text,
          // pgvector-Insert via raw SQL
          embedding: sql.raw(`'[${embedding.join(",")}]'`),
        })
        .where(eq(healthEmbeddings.userId, userId));
    } else {
      // ➕ Insert neuer Eintrag
      await db.insert(healthEmbeddings).values({
        userId,
        content: text,
        embedding: sql.raw(`'[${embedding.join(",")}]'`),
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Embedding error:", error);
    return new Response(
      JSON.stringify({ error: "Embedding failed" }),
      { status: 500 }
    );
  }
}
