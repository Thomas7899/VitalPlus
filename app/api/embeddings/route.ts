import OpenAI from "openai";
import { db } from "@/db/client";
import { healthEmbeddings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { userId, text } = await req.json();

    if (!userId || !text) {
      return NextResponse.json({ error: "Missing userId or text" }, { status: 400 });
    }

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const existing = await db
      .select()
      .from(healthEmbeddings)
      .where(eq(healthEmbeddings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(healthEmbeddings)
        .set({
          content: text,
          embedding,
        })
        .where(eq(healthEmbeddings.userId, userId));
    } else {
      await db.insert(healthEmbeddings).values({
        userId,
        content: text,
        embedding,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Embedding error:", error);
    return NextResponse.json({ error: "Embedding failed" }, { status: 500 });
  }
}
