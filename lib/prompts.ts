// lib/prompts.ts

// System-Prompt für alle Gesundheitscoach-Interaktionen
export const HEALTH_COACH_SYSTEM_PROMPT = `
Du bist ein digitaler Gesundheitscoach.
Deine Aufgaben:
1. Analysiere Gesundheitsdaten präzise.
2. Gib motivierende, aber ehrliche Rückmeldungen.
3. Vermeide medizinische Diagnosen. Weise bei extremen Werten darauf hin, einen Arzt aufzusuchen.
4. Antworte immer im geforderten JSON-Format, wenn danach gefragt wird.
`;

// Prompt für den Tagesplan
export function generateDailyPlanPrompt(stats: {
  calories: number;
  steps: number;
  weight: number;
  goal: string;
  context?: string;
}) {
  return `
    Analysiere die letzten 7 Tage und erstelle für heute einen Vorschlag.
    
    Daten des Nutzers (Durchschnitt letzte 7 Tage):
    - Kalorienaufnahme: ${stats.calories} kcal
    - Schritte: ${stats.steps}
    - Gewicht: ${stats.weight} kg
    
    Ziel des Nutzers: ${stats.goal}
    
    Zusätzlicher Kontext (aus Langzeitgedächtnis):
    ${stats.context || "Kein Kontext verfügbar."}
    
    Erstelle bitte ein JSON-Objekt im folgenden Format:
    {
      "summary": "Kurze Zusammenfassung der Situation (max. 2 Sätze)",
      "nutrition": [
        { "meal": "Frühstück", "content": "Vorschlag für das Frühstück" },
        { "meal": "Mittagessen", "content": "Vorschlag für das Mittagessen" },
        { "meal": "Abendessen", "content": "Vorschlag für das Abendessen" },
        { "meal": "Snacks", "content": "Optionale Snacks" }
      ],
      "training": "Empfohlene Bewegung oder Übungen für heute",
      "motivation": "Ein kurzer Motivationssatz für den Tag"
    }
  `;
}

// Prompt für Warnsignale/Alerts
export function generateAlertAnalysisPrompt(alerts: string[], goal: string) {
  return `
    Hier sind aktuelle Auffälligkeiten in den Gesundheitsdaten:
    ${alerts.join("\n")}
    
    Das Ziel des Nutzers lautet: ${goal}
    
    Erstelle eine kurze, motivierende Empfehlung für heute (max. 50 Wörter):
    - Was sollte der Nutzer essen?
    - Wie könnte er sich bewegen?
    - Wie kann er sich erholen?
  `;
}

// Prompt für die allgemeine Gesundheitsanalyse (Health Coach)
export function generateCoachAnalysisPrompt(summaryData: string, goal: string) {
  return `
    Hier sind die Gesundheitsdaten der letzten 30 Tage:
    ${summaryData}
    
    Ziel des Nutzers: ${goal}
    
    Analysiere die Daten und gib deine Antwort IMMER als valides JSON-Objekt zurück.
    Das Objekt soll so aussehen:
    {
      "sections": [
        { 
          "title": "Titel der Sektion", 
          "content": "Inhalt der Analyse (Markdown erlaubt)", 
          "type": "summary" | "warning" | "nutrition" | "training" | "sleep" | "info" 
        }
      ]
    }
  `;
}