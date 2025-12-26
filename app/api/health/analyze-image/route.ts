// app/api/health/analyze-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Unterstützte Analyse-Typen
type AnalysisType = "food" | "blood_pressure" | "weight" | "general";

const requestSchema = z.object({
  image: z.string().min(1, "Bild ist erforderlich"), // Base64 encoded image
  type: z.enum(["food", "blood_pressure", "weight", "general"]).default("general"),
});

// 🍽️ Prompt für Essensanalyse
const FOOD_ANALYSIS_PROMPT = `Du bist ein Ernährungsexperte. Analysiere dieses Foto einer Mahlzeit.

Antworte NUR mit einem validen JSON-Objekt in diesem Format:
{
  "detected": true,
  "confidence": 0.85,
  "items": [
    {"name": "Spaghetti Bolognese", "portion": "1 Teller", "calories": 550, "protein": 25, "carbs": 65, "fat": 18}
  ],
  "totalCalories": 550,
  "totalProtein": 25,
  "totalCarbs": 65,
  "totalFat": 18,
  "mealType": "Mittagessen",
  "healthScore": 7,
  "notes": "Ausgewogene Mahlzeit mit guter Proteinquelle"
}

Falls kein Essen erkannt wird:
{
  "detected": false,
  "error": "Kein Essen auf dem Bild erkannt"
}

Schätze die Nährwerte basierend auf typischen Portionsgrößen. Sei realistisch.`;

// 🩸 Prompt für Blutdruckmessung
const BLOOD_PRESSURE_PROMPT = `Du bist ein medizinischer Assistent. Analysiere dieses Foto eines Blutdruckmessgeräts.

Antworte NUR mit einem validen JSON-Objekt in diesem Format:
{
  "detected": true,
  "confidence": 0.95,
  "systolic": 120,
  "diastolic": 80,
  "pulse": 72,
  "category": "Normal",
  "categoryColor": "green",
  "notes": "Optimaler Blutdruck"
}

Kategorien:
- "Normal" (grün): < 120/80
- "Erhöht" (gelb): 120-129 / < 80
- "Bluthochdruck Stufe 1" (orange): 130-139 / 80-89
- "Bluthochdruck Stufe 2" (rot): ≥ 140 / ≥ 90
- "Hypertensive Krise" (dunkelrot): > 180 / > 120

Falls keine Werte erkannt werden:
{
  "detected": false,
  "error": "Keine Blutdruckwerte auf dem Bild erkannt"
}`;

// ⚖️ Prompt für Waage
const WEIGHT_PROMPT = `Du bist ein Gesundheitsassistent. Analysiere dieses Foto einer Waage oder Körperanalysewaage.

Antworte NUR mit einem validen JSON-Objekt in diesem Format:
{
  "detected": true,
  "confidence": 0.9,
  "weight": 75.5,
  "unit": "kg",
  "bodyFat": 18.5,
  "muscleMass": 42.3,
  "bmi": 24.2,
  "notes": "Alle erkannten Werte vom Display"
}

Falls keine Werte erkannt werden:
{
  "detected": false,
  "error": "Keine Gewichtswerte auf dem Bild erkannt"
}

Hinweis: Nicht alle Wagen zeigen alle Werte. Gib nur an, was du sicher erkennst.`;

// 🔍 Allgemeiner Prompt
const GENERAL_PROMPT = `Du bist ein Gesundheitsassistent. Analysiere dieses Bild und erkenne gesundheitsrelevante Daten.

Das können sein:
- Essen/Mahlzeiten → Kalorien schätzen
- Blutdruckmessgerät → Werte ablesen
- Waage → Gewicht ablesen
- Fitness-Tracker Display → Werte ablesen
- Medikamentenpackungen → Medikament identifizieren

Antworte NUR mit einem validen JSON-Objekt:
{
  "type": "food|blood_pressure|weight|fitness|medication|unknown",
  "detected": true,
  "data": { ... je nach Typ ... },
  "summary": "Kurze Zusammenfassung auf Deutsch"
}`;

function getPromptForType(type: AnalysisType): string {
  switch (type) {
    case "food":
      return FOOD_ANALYSIS_PROMPT;
    case "blood_pressure":
      return BLOOD_PRESSURE_PROMPT;
    case "weight":
      return WEIGHT_PROMPT;
    default:
      return GENERAL_PROMPT;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 🔐 Authentifizierung prüfen
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ungültige Anfrage", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { image, type } = parseResult.data;

    // Prüfe ob Base64 oder URL
    const isBase64 = image.startsWith("data:image");
    const imageUrl = isBase64 ? image : image;

    // 🤖 OpenAI Vision API aufrufen
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: getPromptForType(type) },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high", // Hohe Auflösung für bessere Erkennung
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: "Keine Antwort von der KI erhalten" },
        { status: 500 }
      );
    }

    // JSON aus der Antwort extrahieren
    let analysisResult;
    try {
      // Versuche JSON direkt zu parsen
      analysisResult = JSON.parse(content);
    } catch {
      // Falls JSON in Markdown eingebettet ist
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Konnte KI-Antwort nicht verarbeiten", raw: content },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      type,
      userId: session.user.id,
      analysis: analysisResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Fehler bei der Bildanalyse:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler bei der Bildanalyse" },
      { status: 500 }
    );
  }
}
