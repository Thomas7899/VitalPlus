// app/api/search/route.ts
import OpenAI from "openai";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing query" }),
        { status: 400 }
      );
    }

    // 🧠 1. Generate embedding for search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 🗃️ 2. Run similarity search using pgvector
    const results = await db.execute(sql`
      SELECT id, content
      FROM "HealthEmbedding"
      ORDER BY embedding <-> ${sql.raw(`'[${queryEmbedding.join(",")}]'`)}
      LIMIT 3;
    `);

    // 🧾 3. Return result list
    return new Response(
      JSON.stringify({ results: results.rows }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Search failed:", error);
    return new Response(
      JSON.stringify({ error: "Search failed" }),
      { status: 500 }
    );
  }
}
