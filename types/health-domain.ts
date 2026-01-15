// types/health-domain.ts
/**
 * Saubere Health-Domain-Typen für typsichere Gesundheitsdaten
 * Ersetzt die lose typisierte Index-Signature aus health.ts
 */

import { z } from "zod";

// ============================================
// 📊 METRIC CATEGORIES
// ============================================
export const MetricCategory = {
  ACTIVITY: "activity",
  VITAL: "vital",
  REGENERATION: "regeneration",
  NUTRITION: "nutrition",
  BODY_COMPOSITION: "body_composition",
} as const;

export type MetricCategory = (typeof MetricCategory)[keyof typeof MetricCategory];

// ============================================
// 🩸 BLOOD PRESSURE DOMAIN
// ============================================
export const BloodPressureCategory = {
  NORMAL: "normal",
  ELEVATED: "elevated",
  HYPERTENSION_STAGE_1: "hypertension_stage_1",
  HYPERTENSION_STAGE_2: "hypertension_stage_2",
  HYPERTENSIVE_CRISIS: "hypertensive_crisis",
  HYPOTENSION: "hypotension",
} as const;

export type BloodPressureCategory = (typeof BloodPressureCategory)[keyof typeof BloodPressureCategory];

export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: Date;
  category: BloodPressureCategory;
  isAlert: boolean;
}

/**
 * Klassifiziert Blutdruckwerte nach medizinischen Leitlinien (AHA)
 * @see https://www.heart.org/en/health-topics/high-blood-pressure
 */
export function classifyBloodPressure(systolic: number, diastolic: number): BloodPressureCategory {
  if (systolic < 90 || diastolic < 60) return BloodPressureCategory.HYPOTENSION;
  if (systolic < 120 && diastolic < 80) return BloodPressureCategory.NORMAL;
  if (systolic < 130 && diastolic < 80) return BloodPressureCategory.ELEVATED;
  if (systolic < 140 || diastolic < 90) return BloodPressureCategory.HYPERTENSION_STAGE_1;
  if (systolic < 180 && diastolic < 120) return BloodPressureCategory.HYPERTENSION_STAGE_2;
  return BloodPressureCategory.HYPERTENSIVE_CRISIS;
}

export function getBloodPressureCategoryLabel(category: BloodPressureCategory): string {
  const labels: Record<BloodPressureCategory, string> = {
    [BloodPressureCategory.NORMAL]: "Normal",
    [BloodPressureCategory.ELEVATED]: "Erhöht",
    [BloodPressureCategory.HYPERTENSION_STAGE_1]: "Bluthochdruck Stufe 1",
    [BloodPressureCategory.HYPERTENSION_STAGE_2]: "Bluthochdruck Stufe 2",
    [BloodPressureCategory.HYPERTENSIVE_CRISIS]: "Hypertensive Krise",
    [BloodPressureCategory.HYPOTENSION]: "Niedriger Blutdruck",
  };
  return labels[category];
}

export function getBloodPressureCategoryColor(category: BloodPressureCategory): string {
  const colors: Record<BloodPressureCategory, string> = {
    [BloodPressureCategory.NORMAL]: "text-emerald-500",
    [BloodPressureCategory.ELEVATED]: "text-yellow-400",
    [BloodPressureCategory.HYPERTENSION_STAGE_1]: "text-orange-400",
    [BloodPressureCategory.HYPERTENSION_STAGE_2]: "text-red-500",
    [BloodPressureCategory.HYPERTENSIVE_CRISIS]: "text-red-600",
    [BloodPressureCategory.HYPOTENSION]: "text-blue-400",
  };
  return colors[category];
}

// ============================================
// ❤️ HEART RATE DOMAIN
// ============================================
export const HeartRateZone = {
  RESTING: "resting",
  FAT_BURN: "fat_burn",
  CARDIO: "cardio",
  PEAK: "peak",
  BRADYCARDIA: "bradycardia",
  TACHYCARDIA: "tachycardia",
} as const;

export type HeartRateZone = (typeof HeartRateZone)[keyof typeof HeartRateZone];

/**
 * Klassifiziert Herzfrequenz unter Berücksichtigung von Alter & Aktivitätslevel
 */
export function classifyHeartRate(
  bpm: number,
  age: number = 35,
  isAtRest: boolean = true
): HeartRateZone {
  if (isAtRest) {
    if (bpm < 50) return HeartRateZone.BRADYCARDIA;
    if (bpm > 100) return HeartRateZone.TACHYCARDIA;
    return HeartRateZone.RESTING;
  }
  
  // Max HR nach Tanaka-Formel (genauer als 220-Alter)
  const maxHR = 208 - (0.7 * age);
  const percentage = (bpm / maxHR) * 100;
  
  if (percentage < 60) return HeartRateZone.FAT_BURN;
  if (percentage < 80) return HeartRateZone.CARDIO;
  return HeartRateZone.PEAK;
}

// ============================================
// 😴 SLEEP DOMAIN
// ============================================
export const SleepQuality = {
  POOR: "poor",
  FAIR: "fair",
  GOOD: "good",
  EXCELLENT: "excellent",
} as const;

export type SleepQuality = (typeof SleepQuality)[keyof typeof SleepQuality];

export interface SleepData {
  hours: number;
  quality: SleepQuality;
  deepSleepPercentage?: number;
  remSleepPercentage?: number;
}

/**
 * Klassifiziert Schlafqualität basierend auf Stunden
 * Basiert auf CDC Guidelines für Erwachsene
 */
export function classifySleepQuality(hours: number): SleepQuality {
  if (hours < 5) return SleepQuality.POOR;
  if (hours < 6) return SleepQuality.FAIR;
  if (hours < 8) return SleepQuality.GOOD;
  return SleepQuality.EXCELLENT;
}

// ============================================
// 🍎 NUTRITION DOMAIN
// ============================================
export interface NutritionEntry {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  timestamp: Date;
}

export interface DailyNutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calorieGoal: number;
  isInDeficit: boolean;
  isInSurplus: boolean;
}

// ============================================
// 🏃 ACTIVITY DOMAIN
// ============================================
export const ActivityLevel = {
  SEDENTARY: "sedentary",
  LIGHTLY_ACTIVE: "lightly_active",
  MODERATELY_ACTIVE: "moderately_active",
  VERY_ACTIVE: "very_active",
  ATHLETE: "athlete",
} as const;

export type ActivityLevel = (typeof ActivityLevel)[keyof typeof ActivityLevel];

export interface DailyActivity {
  steps: number;
  activeMinutes: number;
  caloriesBurned: number;
  distance?: number;
  floors?: number;
}

/**
 * Berechnet empfohlene Schritte basierend auf Aktivitätslevel
 */
export function getRecommendedSteps(activityLevel: ActivityLevel): number {
  const recommendations: Record<ActivityLevel, number> = {
    [ActivityLevel.SEDENTARY]: 5000,
    [ActivityLevel.LIGHTLY_ACTIVE]: 7500,
    [ActivityLevel.MODERATELY_ACTIVE]: 10000,
    [ActivityLevel.VERY_ACTIVE]: 12500,
    [ActivityLevel.ATHLETE]: 15000,
  };
  return recommendations[activityLevel];
}

// ============================================
// 📊 HEALTH TREND ANALYSIS
// ============================================
export const TrendDirection = {
  INCREASING: "increasing",
  DECREASING: "decreasing",
  STABLE: "stable",
} as const;

export type TrendDirection = (typeof TrendDirection)[keyof typeof TrendDirection];

export interface MetricTrend {
  metric: string;
  direction: TrendDirection;
  percentageChange: number;
  periodDays: number;
  isSignificant: boolean;
}

/**
 * Klassifiziert einen Trend basierend auf prozentualem Unterschied
 * Schwelle von 5% verhindert False Positives bei kleinen Schwankungen
 */
export function classifyTrend(percentageChange: number, threshold: number = 5): TrendDirection {
  if (percentageChange > threshold) return TrendDirection.INCREASING;
  if (percentageChange < -threshold) return TrendDirection.DECREASING;
  return TrendDirection.STABLE;
}

// ============================================
// 🏥 HEALTH ALERT TYPES
// ============================================
export const AlertSeverity = {
  INFO: "info",
  WARNING: "warning",
  CRITICAL: "critical",
} as const;

export type AlertSeverity = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const AlertType = {
  BLOOD_PRESSURE_HIGH: "blood_pressure_high",
  BLOOD_PRESSURE_LOW: "blood_pressure_low",
  HEART_RATE_HIGH: "heart_rate_high",
  HEART_RATE_LOW: "heart_rate_low",
  OXYGEN_LOW: "oxygen_low",
  STEPS_LOW: "steps_low",
  SLEEP_LOW: "sleep_low",
  CALORIES_HIGH: "calories_high",
  WEIGHT_CHANGE: "weight_change",
} as const;

export type AlertType = (typeof AlertType)[keyof typeof AlertType];

export interface HealthAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================
// 🤖 AI RESPONSE SCHEMAS (Zod)
// ============================================

/**
 * Schema für Health Coach AI Response
 * Stellt sicher, dass AI-Outputs strukturiert & validiert sind
 */
export const AIHealthSectionSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  type: z.enum(["summary", "warning", "nutrition", "training", "sleep", "info"]),
});

export const AICoachResponseSchema = z.object({
  sections: z.array(AIHealthSectionSchema).min(1).max(10),
});

export type AICoachResponse = z.infer<typeof AICoachResponseSchema>;

/**
 * Schema für Daily Plan AI Response
 */
export const AIDailyPlanMealSchema = z.object({
  meal: z.string(),
  content: z.string(),
});

export const AIDailyPlanSchema = z.object({
  summary: z.string().min(1).max(500),
  nutrition: z.array(AIDailyPlanMealSchema).min(1).max(6),
  training: z.string().min(1).max(500),
  motivation: z.string().min(1).max(200),
});

export type AIDailyPlan = z.infer<typeof AIDailyPlanSchema>;

/**
 * Schema für Image Analysis Response (Food)
 */
export const AIFoodItemSchema = z.object({
  name: z.string(),
  portion: z.string(),
  calories: z.number().min(0).max(5000),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
});

export const AIFoodAnalysisSchema = z.object({
  detected: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  items: z.array(AIFoodItemSchema).optional(),
  totalCalories: z.number().min(0).optional(),
  totalProtein: z.number().min(0).optional(),
  totalCarbs: z.number().min(0).optional(),
  totalFat: z.number().min(0).optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  healthScore: z.number().min(0).max(10).optional(),
  notes: z.string().max(500).optional(),
});

export type AIFoodAnalysis = z.infer<typeof AIFoodAnalysisSchema>;

/**
 * Schema für Image Analysis Response (Blood Pressure)
 */
export const AIBloodPressureAnalysisSchema = z.object({
  detected: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  systolic: z.number().min(50).max(300).optional(),
  diastolic: z.number().min(30).max(200).optional(),
  pulse: z.number().min(30).max(250).optional(),
  category: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type AIBloodPressureAnalysis = z.infer<typeof AIBloodPressureAnalysisSchema>;

/**
 * Schema für Image Analysis Response (Weight)
 */
export const AIWeightAnalysisSchema = z.object({
  detected: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  weight: z.number().min(20).max(500).optional(),
  unit: z.enum(["kg", "lbs"]).optional(),
  bodyFat: z.number().min(1).max(70).optional(),
  muscleMass: z.number().min(10).max(100).optional(),
  bmi: z.number().min(10).max(60).optional(),
  notes: z.string().max(500).optional(),
});

export type AIWeightAnalysis = z.infer<typeof AIWeightAnalysisSchema>;

// ============================================
// 🔧 UTILITY TYPES
// ============================================

/**
 * Vollständig typisierter Health Data Point
 * Ersetzt die unsichere Index-Signature
 */
export interface TypedHealthDataPoint {
  id: string;
  userId: string;
  date: Date;
  
  // Activity
  steps?: number;
  stairSteps?: number;
  elevation?: number;
  
  // Vitals
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenSaturation?: number;
  bodyTemp?: number;
  respiratoryRate?: number;
  
  // Body Composition
  weight?: number;
  bmi?: number;
  bodyFat?: number;
  muscleMass?: number;
  
  // Sleep
  sleepHours?: number;
  
  // Nutrition
  calories?: number;
  mealType?: string;
  
  // Medical
  bloodGroup?: string;
  medications?: string;
}

/**
 * Helper zur Berechnung des BMI
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Klassifiziert BMI nach WHO-Standards
 */
export function classifyBMI(bmi: number): string {
  if (bmi < 18.5) return "Untergewicht";
  if (bmi < 25) return "Normalgewicht";
  if (bmi < 30) return "Übergewicht";
  if (bmi < 35) return "Adipositas Grad I";
  if (bmi < 40) return "Adipositas Grad II";
  return "Adipositas Grad III";
}
