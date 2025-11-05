// lib/embeddings.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateEmbedding(value: string): Promise<number[]> {
  const input = value.replaceAll("\n", " ");
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });
  return response.data[0].embedding;
}
