// lib/embeddings.ts
/**
 * Embedding-Generierung für RAG-System
 * Verwendet OpenAI text-embedding-3-small (1536 Dimensionen)
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Cache für häufig verwendete Embeddings (in-memory für Server)
const embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 Stunde

/**
 * Generiert ein Embedding für einen Text
 * Mit Caching für identische Texte
 */
export async function generateEmbedding(value: string): Promise<number[]> {
  // Input sanitization
  if (!value || typeof value !== "string") {
    throw new Error("Embedding input must be a non-empty string");
  }

  // Normalisierung für konsistente Embeddings
  const normalizedInput = value
    .replaceAll("\n", " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000); // Max ~8000 chars für embedding model

  if (normalizedInput.length < 10) {
    throw new Error("Input too short for meaningful embedding");
  }

  // Cache-Check
  const cacheKey = hashString(normalizedInput);
  const cached = embeddingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.embedding;
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: normalizedInput,
    });

    const embedding = response.data[0].embedding;

    // Cache speichern
    embeddingCache.set(cacheKey, { embedding, timestamp: Date.now() });

    // Cache-Cleanup bei zu vielen Einträgen
    if (embeddingCache.size > 1000) {
      cleanupCache();
    }

    return embedding;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generiert Embeddings für mehrere Texte (Batch)
 * Effizienter als einzelne Aufrufe
 */
export async function generateEmbeddingsBatch(values: string[]): Promise<number[][]> {
  if (!values.length) return [];

  const normalizedInputs = values.map(v =>
    v.replaceAll("\n", " ").replace(/\s+/g, " ").trim().slice(0, 8000)
  ).filter(v => v.length >= 10);

  if (!normalizedInputs.length) return [];

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: normalizedInputs,
    });

    return response.data.map(d => d.embedding);
  } catch (error) {
    console.error("Batch embedding generation failed:", error);
    throw new Error("Failed to generate batch embeddings");
  }
}

/**
 * Berechnet Cosine Similarity zwischen zwei Embeddings
 * Nützlich für lokale Ähnlichkeitsvergleiche
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Erstellt optimierten Text für Health-Data Embedding
 */
export function createHealthSummaryForEmbedding(data: {
  avgSteps: number;
  avgSleep: number;
  avgHeartRate: number;
  avgWeight: number;
  avgCalories: number;
  avgSystolic: number;
  avgDiastolic: number;
  avgOxygen: number;
  trends?: string[];
}): string {
  const parts: string[] = [];

  // Aktivität
  if (data.avgSteps > 0) {
    const stepsCategory = data.avgSteps < 5000 ? "wenig aktiv" : 
                          data.avgSteps < 8000 ? "moderat aktiv" : "sehr aktiv";
    parts.push(`Aktivität: ${data.avgSteps} Schritte/Tag (${stepsCategory})`);
  }

  // Schlaf
  if (data.avgSleep > 0) {
    const sleepCategory = data.avgSleep < 6 ? "zu wenig Schlaf" :
                          data.avgSleep < 7 ? "ausreichend Schlaf" : "guter Schlaf";
    parts.push(`Schlaf: ${data.avgSleep.toFixed(1)}h (${sleepCategory})`);
  }

  // Vitals
  if (data.avgHeartRate > 0) {
    const hrCategory = data.avgHeartRate < 60 ? "niedrig" :
                       data.avgHeartRate < 80 ? "normal" : "erhöht";
    parts.push(`Ruhepuls: ${data.avgHeartRate} bpm (${hrCategory})`);
  }

  if (data.avgSystolic > 0 && data.avgDiastolic > 0) {
    const bpCategory = data.avgSystolic < 120 && data.avgDiastolic < 80 ? "normal" :
                       data.avgSystolic < 130 ? "leicht erhöht" : "erhöht";
    parts.push(`Blutdruck: ${data.avgSystolic}/${data.avgDiastolic} (${bpCategory})`);
  }

  if (data.avgOxygen > 0) {
    parts.push(`Sauerstoffsättigung: ${data.avgOxygen}%`);
  }

  // Körperdaten
  if (data.avgWeight > 0) {
    parts.push(`Gewicht: ${data.avgWeight.toFixed(1)} kg`);
  }

  if (data.avgCalories > 0) {
    parts.push(`Kalorien: ${data.avgCalories} kcal/Tag`);
  }

  // Trends
  if (data.trends?.length) {
    parts.push(`Trends: ${data.trends.join(", ")}`);
  }

  return parts.join(". ") + ".";
}

// Hilfsfunktionen
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of embeddingCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      embeddingCache.delete(key);
    }
  }
}
