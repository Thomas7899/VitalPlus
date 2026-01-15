// app/api/search/route.ts
/**
 * RAG Search API - Semantic Search über Health Embeddings
 * Mit Authentifizierung und verbesserter Similarity Search
 */

import OpenAI from "openai";
import { db } from "@/db/client";
import { healthEmbeddings } from "@/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sanitizeUserInput } from "@/lib/ai-validation";
import { NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Minimale Similarity-Score für relevante Ergebnisse
const MIN_SIMILARITY_THRESHOLD = 0.7;

export async function POST(req: Request) {
  try {
    // 🔐 Authentifizierung prüfen
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { query, includeGlobal = false, limit = 5 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter fehlt oder ungültig" },
        { status: 400 }
      );
    }

    // 🛡️ Sanitize query input
    const sanitizedQuery = sanitizeUserInput(query);
    if (sanitizedQuery.length < 3) {
      return NextResponse.json(
        { error: "Suchanfrage zu kurz (min. 3 Zeichen)" },
        { status: 400 }
      );
    }

    // 🧠 Generate embedding for search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: sanitizedQuery,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 🗃️ Run similarity search using pgvector
    // Suche primär in den Embeddings des eigenen Users
    const userResults = await db.execute<{
      id: string;
      user_id: string;
      content: string;
      similarity: number;
    }>(sql`
      SELECT 
        id, 
        user_id,
        content,
        1 - (embedding <=> ${sql.raw(`'[${queryEmbedding.join(",")}]'::vector`)}) as similarity
      FROM health_embeddings
      WHERE user_id = ${session.user.id}
        AND 1 - (embedding <=> ${sql.raw(`'[${queryEmbedding.join(",")}]'::vector`)}) > ${MIN_SIMILARITY_THRESHOLD}
      ORDER BY similarity DESC
      LIMIT ${Math.min(limit, 10)};
    `);

    // Optional: Globale Suche (z.B. für Health-Wissen-Datenbank)
    let globalResults: typeof userResults.rows = [];
    if (includeGlobal && userResults.rows.length < limit) {
      // Hier könnte man eine separate Tabelle mit globalem Health-Wissen durchsuchen
      // Für jetzt: Nur User-Daten
    }

    // Kombiniere und sortiere Ergebnisse
    const allResults = [...userResults.rows, ...globalResults]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // 🧾 Return results mit Metadaten
    return NextResponse.json({
      success: true,
      query: sanitizedQuery,
      results: allResults.map((r) => ({
        id: r.id,
        content: r.content,
        similarity: Math.round(r.similarity * 100) / 100,
        isOwnData: r.user_id === session.user?.id,
      })),
      totalResults: allResults.length,
    });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { error: "Suche fehlgeschlagen" },
      { status: 500 }
    );
  }
}
