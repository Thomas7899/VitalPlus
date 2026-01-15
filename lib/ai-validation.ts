// lib/ai-validation.ts
/**
 * AI Output Validation & Sanitization
 * Stellt sicher, dass LLM-Outputs sicher und strukturiert sind
 */

import { ZodSchema } from "zod";
import {
  AICoachResponseSchema,
  AIDailyPlanSchema,
  AIFoodAnalysisSchema,
  AIBloodPressureAnalysisSchema,
  AIWeightAnalysisSchema,
  type AICoachResponse,
  type AIDailyPlan,
  type AIFoodAnalysis,
  type AIBloodPressureAnalysis,
  type AIWeightAnalysis,
} from "@/types/health-domain";

// ============================================
// 🛡️ GENERIC VALIDATION
// ============================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  fallback?: T;
}

/**
 * Validiert und sanitized AI-Output gegen ein Zod-Schema
 */
export function validateAIOutput<T>(
  rawOutput: string | object,
  schema: ZodSchema<T>,
  fallback?: T
): ValidationResult<T> {
  try {
    // Parse JSON wenn String
    const data = typeof rawOutput === "string" ? JSON.parse(rawOutput) : rawOutput;
    
    // Validiere gegen Schema
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    // Bei Validierungsfehler: Fallback oder Error
    console.warn("AI Output validation failed:", result.error.flatten());
    
    if (fallback) {
      return { success: false, data: fallback, error: "Validation failed, using fallback", fallback };
    }
    
    return { 
      success: false, 
      error: `Validation failed: ${result.error.issues.map(i => i.message).join(", ")}` 
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown parsing error";
    console.error("AI Output parsing error:", errorMsg);
    
    if (fallback) {
      return { success: false, data: fallback, error: errorMsg, fallback };
    }
    
    return { success: false, error: errorMsg };
  }
}

// ============================================
// 🏥 HEALTH COACH VALIDATION
// ============================================

const FALLBACK_COACH_RESPONSE: AICoachResponse = {
  sections: [
    {
      title: "Analyse nicht verfügbar",
      content: "Die KI-Analyse konnte nicht verarbeitet werden. Bitte versuche es später erneut.",
      type: "info",
    },
  ],
};

export function validateCoachResponse(rawOutput: string | object): ValidationResult<AICoachResponse> {
  return validateAIOutput(rawOutput, AICoachResponseSchema, FALLBACK_COACH_RESPONSE);
}

// ============================================
// 📅 DAILY PLAN VALIDATION
// ============================================

const FALLBACK_DAILY_PLAN: AIDailyPlan = {
  summary: "Tagesplan konnte nicht erstellt werden.",
  nutrition: [
    { meal: "Frühstück", content: "Ausgewogenes Frühstück empfohlen" },
    { meal: "Mittagessen", content: "Proteinreich und nährstoffdicht essen" },
    { meal: "Abendessen", content: "Leichte Mahlzeit bevorzugen" },
  ],
  training: "30 Minuten moderate Bewegung empfohlen",
  motivation: "Jeder Tag ist eine neue Chance!",
};

export function validateDailyPlanResponse(rawOutput: string | object): ValidationResult<AIDailyPlan> {
  return validateAIOutput(rawOutput, AIDailyPlanSchema, FALLBACK_DAILY_PLAN);
}

// ============================================
// 📸 IMAGE ANALYSIS VALIDATION
// ============================================

const FALLBACK_FOOD_ANALYSIS: AIFoodAnalysis = {
  detected: false,
  notes: "Nahrungsmittel konnten nicht erkannt werden.",
};

export function validateFoodAnalysis(rawOutput: string | object): ValidationResult<AIFoodAnalysis> {
  return validateAIOutput(rawOutput, AIFoodAnalysisSchema, FALLBACK_FOOD_ANALYSIS);
}

const FALLBACK_BP_ANALYSIS: AIBloodPressureAnalysis = {
  detected: false,
  notes: "Blutdruckwerte konnten nicht erkannt werden.",
};

export function validateBloodPressureAnalysis(rawOutput: string | object): ValidationResult<AIBloodPressureAnalysis> {
  return validateAIOutput(rawOutput, AIBloodPressureAnalysisSchema, FALLBACK_BP_ANALYSIS);
}

const FALLBACK_WEIGHT_ANALYSIS: AIWeightAnalysis = {
  detected: false,
  notes: "Gewichtsdaten konnten nicht erkannt werden.",
};

export function validateWeightAnalysis(rawOutput: string | object): ValidationResult<AIWeightAnalysis> {
  return validateAIOutput(rawOutput, AIWeightAnalysisSchema, FALLBACK_WEIGHT_ANALYSIS);
}

// ============================================
// 🛡️ PROMPT INJECTION PREVENTION
// ============================================

const DANGEROUS_PATTERNS = [
  /ignore\s+(previous|all|above)\s+(instructions?|prompts?)/i,
  /system\s*:/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /\{\{.*\}\}/,
  /\$\{.*\}/,
  /<\|.*\|>/,
  /jailbreak/i,
  /DAN\s*mode/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+if/i,
  /reveal\s+(your|the)\s+(prompt|instructions?|system)/i,
];

/**
 * Sanitized User-Input um Prompt Injection zu verhindern
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  
  // Trim & limit length
  let sanitized = input.trim().slice(0, 2000);
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn("Potential prompt injection detected:", pattern.source);
      // Remove the dangerous part instead of rejecting entirely
      sanitized = sanitized.replace(pattern, "[FILTERED]");
    }
  }
  
  // Remove potential control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
  
  return sanitized;
}

/**
 * Validiert dass ein User-Goal sicher ist
 */
export function validateHealthGoal(goal: string): string {
  const sanitized = sanitizeUserInput(goal);
  
  // Erlaubte Ziele (Whitelist)
  const allowedGoals = [
    "abnehmen",
    "zunehmen",
    "muskelaufbau",
    "gesund_bleiben",
    "gewicht_halten",
    "ausdauer_verbessern",
    "stress_reduzieren",
    "schlaf_verbessern",
  ];
  
  // Wenn das Ziel in der Whitelist ist, verwende es direkt
  const normalized = sanitized.toLowerCase().replace(/\s+/g, "_");
  if (allowedGoals.includes(normalized)) {
    return sanitized;
  }
  
  // Sonst verwende das sanitized Goal aber limitiere auf sichere Länge
  return sanitized.slice(0, 100);
}

// ============================================
// 🏥 MEDICAL DISCLAIMER INJECTION
// ============================================

/**
 * Fügt medizinische Disclaimer zu AI-Antworten hinzu wenn nötig
 */
export function addMedicalDisclaimer(response: AICoachResponse): AICoachResponse {
  const hasWarning = response.sections.some(s => s.type === "warning");
  const hasCriticalValues = response.sections.some(s => 
    s.content.includes("Arzt") || 
    s.content.includes("kritisch") ||
    s.content.includes("gefährlich")
  );
  
  if (hasWarning || hasCriticalValues) {
    // Disclaimer am Ende hinzufügen wenn noch nicht vorhanden
    const hasDisclaimer = response.sections.some(s => 
      s.content.includes("Hinweis:") && s.content.includes("medizinische Beratung")
    );
    
    if (!hasDisclaimer) {
      return {
        sections: [
          ...response.sections,
          {
            title: "⚕️ Wichtiger Hinweis",
            content: "Diese Analyse ersetzt keine medizinische Beratung. Bei auffälligen Werten oder Beschwerden konsultiere bitte einen Arzt.",
            type: "info",
          },
        ],
      };
    }
  }
  
  return response;
}

// ============================================
// 📊 RESPONSE METRICS
// ============================================

/**
 * Extrahiert Metriken aus AI-Responses für Logging/Analytics
 */
export function extractResponseMetrics(response: AICoachResponse): {
  sectionCount: number;
  hasWarnings: boolean;
  avgContentLength: number;
  types: string[];
} {
  return {
    sectionCount: response.sections.length,
    hasWarnings: response.sections.some(s => s.type === "warning"),
    avgContentLength: Math.round(
      response.sections.reduce((sum, s) => sum + s.content.length, 0) / response.sections.length
    ),
    types: [...new Set(response.sections.map(s => s.type))],
  };
}
