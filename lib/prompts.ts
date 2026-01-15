// lib/prompts.ts

import type { DataAvailability } from "./data-availability";

/**
 * System-Prompt für alle Gesundheitscoach-Interaktionen
 * 
 * WICHTIG: Dieser Prompt definiert die Persona und Grenzen des AI-Assistenten.
 * Änderungen sollten sorgfältig geprüft werden (medizinische/rechtliche Implikationen).
 */
export const HEALTH_COACH_SYSTEM_PROMPT = `Du bist ein erfahrener, empathischer digitaler Gesundheitscoach für die VitalPlus-App.

## Deine Kernprinzipien:

### 1. Medizinische Vorsicht (OBERSTE PRIORITÄT)
- Du stellst NIEMALS medizinische Diagnosen
- Du empfiehlst KEINE spezifischen Medikamente oder Dosierungen
- Bei kritischen Werten (Blutdruck >180/120, Puls <40 oder >120 in Ruhe, O2 <90%) empfiehlst du IMMER einen Arztbesuch
- Du verwendest Formulierungen wie "könnte darauf hindeuten", "es wäre ratsam" statt definitiver Aussagen

### 2. Datenbasierte Analyse
- Basiere Empfehlungen nur auf den bereitgestellten Daten
- Erkenne Trends über Zeiträume (7-30 Tage)
- Berücksichtige das individuelle Aktivitätslevel und Ziel des Nutzers
- Erkläre kurz, WARUM du eine Empfehlung gibst

### 3. Strukturierte Antworten
- Antworte IMMER im geforderten JSON-Format
- Halte Texte prägnant (max. 2-3 Sätze pro Abschnitt)
- Verwende klare Kategorien: summary, warning, nutrition, training, sleep, info
- Priorisiere: Erst Warnungen, dann Zusammenfassung, dann Empfehlungen

### 4. Motivierender Ton
- Sei ermutigend, aber ehrlich
- Feiere Fortschritte, auch kleine
- Formuliere Verbesserungsvorschläge positiv ("Du könntest..." statt "Du solltest nicht...")
- Personalisiere basierend auf dem Nutzerziel

### 5. Grenzen erkennen
- Bei Symptomen wie Brustschmerzen, Atemnot, starkem Schwindel: Sofortige Arztempfehlung
- Bei Essstörungshinweisen: Sensibel reagieren, professionelle Hilfe empfehlen
- Bei Dateninkonsistenzen: Nachfrage empfehlen statt Spekulation

## Verbotene Aktionen:
- Diagnosen stellen
- Medikamente empfehlen
- Fasten unter 1200kcal/Tag empfehlen
- Extreme Trainingsintensitäten ohne Aufbau empfehlen
- Medizinische Dringlichkeiten herunterspielen`;

// Prompt für den Tagesplan - Verbessert mit strukturiertem Output
export function generateDailyPlanPrompt(stats: {
  calories: number;
  steps: number;
  weight: number;
  goal: string;
  context?: string;
}) {
  // Eingabe-Validierung
  const safeCalories = Math.max(0, Math.min(stats.calories, 10000));
  const safeSteps = Math.max(0, Math.min(stats.steps, 100000));
  const safeWeight = Math.max(20, Math.min(stats.weight, 300));
  const safeGoal = stats.goal.slice(0, 100);
  const safeContext = (stats.context || "Keine erweiterten Daten verfügbar.").slice(0, 500);

  return `Erstelle einen personalisierten Tagesplan basierend auf folgenden Daten.

## Nutzerdaten (Durchschnitt der letzten 7 Tage):
- Kalorienaufnahme: ${safeCalories} kcal/Tag
- Tägliche Schritte: ${safeSteps}
- Aktuelles Gewicht: ${safeWeight} kg
- Persönliches Ziel: ${safeGoal}

## Zusätzlicher Kontext aus bisherigen Analysen:
${safeContext}

## Deine Aufgabe:
Erstelle einen motivierenden, aber realistischen Tagesplan. Berücksichtige:
- Die aktuelle Kalorienbilanz im Verhältnis zum Ziel
- Das Aktivitätsniveau (basierend auf Schritten)
- Praktisch umsetzbare Empfehlungen

## WICHTIG - Antworte NUR mit diesem JSON-Format:
{
  "summary": "Max. 2 Sätze zur aktuellen Situation und dem heutigen Fokus",
  "nutrition": [
    { "meal": "Frühstück", "content": "Konkreter Vorschlag (z.B. Haferflocken mit Beeren, ca. 350 kcal)" },
    { "meal": "Mittagessen", "content": "Konkreter Vorschlag mit ungefährer Kalorienzahl" },
    { "meal": "Abendessen", "content": "Konkreter Vorschlag mit ungefährer Kalorienzahl" },
    { "meal": "Snacks", "content": "1-2 gesunde Snack-Optionen" }
  ],
  "training": "Konkrete Bewegungsempfehlung für heute (Art, Dauer, Intensität)",
  "motivation": "Persönlicher Motivationssatz (max. 20 Wörter)"
}`;
}

// Prompt für Warnsignale/Alerts - Verbessert mit Kontext
export function generateAlertAnalysisPrompt(alerts: string[], goal: string) {
  const safeAlerts = alerts.slice(0, 5).map(a => a.slice(0, 200));
  const safeGoal = goal.slice(0, 100);

  return `Der Nutzer hat folgende Gesundheits-Alerts erhalten:

${safeAlerts.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Nutzerziel: ${safeGoal}

Erstelle eine kurze, einfühlsame Empfehlung (40-60 Wörter) die:
1. Die wichtigsten Alerts priorisiert
2. Konkrete, heute umsetzbare Schritte nennt
3. Motivierend formuliert ist
4. Bei kritischen Werten auf Arztbesuch hinweist

Antworte als Fließtext, KEIN JSON.`;
}

// Prompt für die allgemeine Gesundheitsanalyse (Health Coach) - Verbessert
export function generateCoachAnalysisPrompt(summaryData: string, goal: string) {
  const safeData = summaryData.slice(0, 3000);
  const safeGoal = goal.slice(0, 100);

  return `Analysiere die Gesundheitsdaten und erstelle eine strukturierte Auswertung.

## Gesundheitsdaten der letzten 30 Tage:
${safeData}

## Nutzerziel: ${safeGoal}

## Analyse-Aufgaben:
1. **Zusammenfassung**: Gesamtbild der Gesundheit in 2-3 Sätzen
2. **Warnungen**: Auffällige Werte oder negative Trends (falls vorhanden)
3. **Stärken**: Positive Entwicklungen hervorheben
4. **Empfehlungen**: 2-3 konkrete, umsetzbare Verbesserungsvorschläge

## WICHTIGE REGELN:
- Bei Blutdruck >180/120 oder <90/60: Arztbesuch empfehlen
- Bei Ruhepuls >100 oder <45: Auf mögliche Ursachen hinweisen
- Bei <5h Schlaf über mehrere Tage: Schlafhygiene thematisieren
- Keine Diagnosen stellen, nur auf Auffälligkeiten hinweisen

## Antworte NUR mit diesem JSON-Format:
{
  "sections": [
    { "title": "Zusammenfassung", "content": "...", "type": "summary" },
    { "title": "Wichtige Hinweise", "content": "...", "type": "warning" },
    { "title": "Ernährungstipps", "content": "...", "type": "nutrition" },
    { "title": "Bewegungsempfehlung", "content": "...", "type": "training" },
    { "title": "Schlaf & Erholung", "content": "...", "type": "sleep" }
  ]
}

Lasse Sektionen mit type "warning" weg, wenn keine Auffälligkeiten vorliegen.
Halte jeden content-Abschnitt auf max. 100 Wörter.`;
}

// ============================================
// 📸 IMAGE ANALYSIS PROMPTS
// ============================================

/**
 * Prompt für Food Image Analysis (Vision API)
 */
export function generateFoodAnalysisPrompt(): string {
  return `Analysiere dieses Bild eines Essens/Gerichts.

## Deine Aufgabe:
1. Identifiziere alle erkennbaren Nahrungsmittel
2. Schätze Portionsgrößen basierend auf visuellen Hinweisen
3. Berechne ungefähre Nährwerte (Kalorien, Protein, Kohlenhydrate, Fett)
4. Bewerte die Mahlzeit auf einer Skala von 1-10 (Gesundheit)

## WICHTIG:
- Sei konservativ bei Kalorieneschätzungen (eher etwas höher)
- Wenn unsicher, gib einen Bereich an
- Bei nicht erkennbaren Inhalten: detected = false

## Antworte NUR mit diesem JSON-Format:
{
  "detected": true/false,
  "confidence": 0.0-1.0,
  "items": [
    { "name": "Nahrungsmittel", "portion": "z.B. 150g", "calories": 250, "protein": 15, "carbs": 20, "fat": 10 }
  ],
  "totalCalories": 500,
  "totalProtein": 30,
  "totalCarbs": 50,
  "totalFat": 20,
  "mealType": "breakfast|lunch|dinner|snack",
  "healthScore": 7,
  "notes": "Optionale Anmerkungen"
}`;
}

/**
 * Prompt für Blood Pressure Display Analysis (Vision API)
 */
export function generateBloodPressureAnalysisPrompt(): string {
  return `Analysiere dieses Bild eines Blutdruckmessgeräts.

## Deine Aufgabe:
1. Lies die angezeigten Werte ab (Systolisch, Diastolisch, Puls)
2. Klassifiziere den Blutdruck nach AHA-Guidelines
3. Prüfe auf offensichtliche Ablesefehler

## Klassifikation:
- Normal: <120/<80
- Erhöht: 120-129/<80
- Bluthochdruck Stufe 1: 130-139/80-89
- Bluthochdruck Stufe 2: ≥140/≥90
- Hypertensive Krise: >180/>120

## WICHTIG:
- Bei Werten >180/120: KRITISCH markieren
- Bei unleserlichem Display: detected = false
- Nur numerische Werte extrahieren

## Antworte NUR mit diesem JSON-Format:
{
  "detected": true/false,
  "confidence": 0.0-1.0,
  "systolic": 120,
  "diastolic": 80,
  "pulse": 72,
  "category": "Normal|Erhöht|Bluthochdruck Stufe 1|Bluthochdruck Stufe 2|Hypertensive Krise",
  "notes": "Optionale Anmerkungen (z.B. bei kritischen Werten)"
}`;
}

/**
 * Prompt für Weight Scale Analysis (Vision API)
 */
export function generateWeightAnalysisPrompt(): string {
  return `Analysiere dieses Bild einer Waage.

## Deine Aufgabe:
1. Lies das angezeigte Gewicht ab
2. Erkenne die Einheit (kg oder lbs)
3. Falls Smart-Waage: Lies zusätzliche Werte (Körperfett, Muskelmasse, BMI)

## WICHTIG:
- Konvertiere lbs zu kg falls nötig (1 lbs = 0.453592 kg)
- Bei unleserlichem Display: detected = false
- Körperfett/BMI nur angeben wenn klar erkennbar

## Antworte NUR mit diesem JSON-Format:
{
  "detected": true/false,
  "confidence": 0.0-1.0,
  "weight": 75.5,
  "unit": "kg",
  "bodyFat": 18.5,
  "muscleMass": 35.2,
  "bmi": 24.1,
  "notes": "Optionale Anmerkungen"
}`;
}

// ============================================
// 📅 LOW-DATA & YEAR-AWARE PROMPTS
// ============================================

/**
 * Generiert einen Kontext-Block für Prompts basierend auf Datenverfügbarkeit
 * WICHTIG für 2026-Readiness: Transparente Kommunikation bei wenig Daten
 */
export function generateDataAvailabilityContext(
  status: DataAvailability,
  daysWithData: number,
  isEarlyYear: boolean
): string {
  if (status === "none") {
    return `
## ⚠️ DATENVERFÜGBARKEIT: KEINE DATEN
Der Nutzer hat noch keine Gesundheitsdaten erfasst.
${isEarlyYear ? "Es ist Jahresbeginn - der Nutzer startet möglicherweise gerade erst." : ""}

### Deine Anweisungen:
- Gib KEINE personalisierten Empfehlungen basierend auf Daten
- Nutze allgemeine, evidenzbasierte Gesundheitstipps
- Erkläre transparent, dass noch keine individuellen Daten vorliegen
- Ermutige zur regelmäßigen Datenerfassung
- Vermeide Spekulationen über den Gesundheitszustand`;
  }

  if (status === "insufficient") {
    return `
## ⚠️ DATENVERFÜGBARKEIT: EINGESCHRÄNKT (${daysWithData} Tage)
Es liegen nur wenige Datenpunkte vor - zu wenig für Trendanalysen.

### Deine Anweisungen:
- Basiere Empfehlungen auf den wenigen verfügbaren Daten + allgemeinen Richtlinien
- Kommuniziere transparent: "Basierend auf deinen ersten Daten..."
- Vermeide Aussagen über Trends oder Entwicklungen
- Ermutige zu weiterer Datenerfassung für genauere Analysen
- Sei vorsichtig mit Interpretationen einzelner Werte`;
  }

  if (status === "limited") {
    return `
## 📊 DATENVERFÜGBARKEIT: BEGRENZT (${daysWithData} Tage)
Erste Trends erkennbar, aber langfristige Muster noch nicht aussagekräftig.

### Deine Anweisungen:
- Kurzfristige Beobachtungen sind möglich
- Formuliere Trends vorsichtig: "In den letzten Tagen..."
- Vermeide Langzeit-Prognosen
- Kombiniere individuelle Daten mit allgemeinen Empfehlungen`;
  }

  if (status === "sufficient") {
    return `
## ✅ DATENVERFÜGBARKEIT: GUT (${daysWithData} Tage)
Aussagekräftige Datenbasis für personalisierte Analysen.

### Deine Anweisungen:
- Nutze die Daten für individuelle Empfehlungen
- Identifiziere und kommuniziere Trends
- Berücksichtige persönliche Muster`;
  }

  // abundant
  return `
## 🏆 DATENVERFÜGBARKEIT: EXZELLENT (${daysWithData} Tage)
Umfangreiche Datenbasis für detaillierte Langzeitanalysen.

### Deine Anweisungen:
- Nutze die volle Datentiefe für Analysen
- Identifiziere langfristige Muster und saisonale Trends
- Erstelle detaillierte, personalisierte Empfehlungen`;
}

/**
 * Generiert Low-Data-Fallback-Empfehlungen
 * Verwendet allgemeine Gesundheitsheuristiken statt individueller Trends
 */
export function generateLowDataFallbackPrompt(
  goal: string,
  isEarlyYear: boolean
): string {
  const safeGoal = goal.slice(0, 100);
  
  return `Da noch nicht genügend individuelle Daten vorliegen, erstelle allgemeine Empfehlungen.

## Nutzerziel: ${safeGoal}
${isEarlyYear ? "## Kontext: Es ist Jahresbeginn - ein guter Zeitpunkt für neue Gesundheitsziele!" : ""}

## Allgemeine Richtlinien (evidenzbasiert):
- Bewegung: 7.000-10.000 Schritte/Tag oder 150 Min moderate Aktivität/Woche
- Schlaf: 7-9 Stunden pro Nacht für Erwachsene
- Hydration: ~2 Liter Wasser pro Tag
- Ernährung: 5 Portionen Obst/Gemüse pro Tag
- Blutdruck: Optimalwert <120/<80 mmHg

## Deine Aufgabe:
Erstelle einen motivierenden, allgemeinen Gesundheitstipp der:
1. Zum Nutzerziel passt
2. Sofort umsetzbar ist
3. Transparent kommuniziert, dass noch mehr Daten für individuelle Empfehlungen benötigt werden
4. Zur regelmäßigen Datenerfassung ermutigt

Antworte im gewünschten JSON-Format, aber halte die Inhalte allgemein.`;
}

/**
 * Generiert einen Jahreswechsel-Kontext für Prompts
 */
export function generateYearTransitionContext(
  currentYear: number,
  previousYear: number,
  daysIntoNewYear: number
): string {
  if (daysIntoNewYear <= 7) {
    return `
## 🎉 JAHRESWECHSEL-KONTEXT
Es ist die erste Woche des Jahres ${currentYear}.
- Der Nutzer hat möglicherweise neue Vorsätze
- Daten aus ${previousYear} können als Baseline dienen
- Sei ermutigend für den Neustart
- Setze realistische Erwartungen für neue Ziele`;
  }

  if (daysIntoNewYear <= 14) {
    return `
## 📅 FRÜHJAHRS-KONTEXT
Wir sind in der zweiten Woche des Jahres ${currentYear}.
- Erste Gewohnheiten bilden sich
- Unterstütze die Konsistenz
- Ermutige auch bei kleinen Rückschlägen`;
  }

  if (daysIntoNewYear <= 30) {
    return `
## 📊 ERSTER MONAT ${currentYear}
Der erste Monat des neuen Jahres läuft.
- Erste Trends können sich abzeichnen
- Evaluiere Fortschritte bei Jahreszielen
- Passe Empfehlungen an die neue Datenlage an`;
  }

  return ""; // Nach dem ersten Monat kein spezieller Kontext nötig
}