// types/health.ts
/**
 * Health-Typen für UI-Komponenten
 * Für Domänenlogik siehe: types/health-domain.ts
 */

import { LucideIcon } from "lucide-react";

export type MetricKey = 
  | "steps" 
  | "heartRate" 
  | "sleepHours" 
  | "weight" 
  | "calories" 
  | "bloodPressureSystolic" 
  | "bloodPressureDiastolic" 
  | "oxygenSaturation" 
  | "bodyTemp" 
  | "respiratoryRate"
  | "muscleMass"  
  | "bodyFat"    
  | "bmi";       

export type MetricCategory = 
  | "Activity" 
  | "Vital" 
  | "Regeneration" 
  | "Nutrition" 
  | "Fitness" 
  | "Vitalwerte" 
  | "Körperwerte";

export interface Metric {
  key: MetricKey;
  label: string;
  unit: string;
  color?: string;
  category?: MetricCategory;
}

/**
 * Typsicherer HealthDataPoint ohne Index-Signature
 * Verwende TypedHealthDataPoint aus health-domain.ts für vollständige Typisierung
 */
export interface HealthDataPoint {
  id: string;
  date: string | Date;
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
 * Hilfsfunktion für dynamischen Zugriff auf Metriken
 */
export function getMetricValue(data: HealthDataPoint, key: MetricKey): number | undefined {
  return data[key] as number | undefined;
}

export interface DashboardTrendData {
  id: string;
  title: string;
  value: string;
  change: string;
  color: string;
  icon: LucideIcon;
}

/**
 * Vordefinierte Metriken mit Konfiguration
 */
export const METRIC_DEFINITIONS: Record<MetricKey, Metric> = {
  steps: { key: "steps", label: "Schritte", unit: "", category: "Activity", color: "blue" },
  heartRate: { key: "heartRate", label: "Herzfrequenz", unit: "bpm", category: "Vital", color: "red" },
  sleepHours: { key: "sleepHours", label: "Schlaf", unit: "h", category: "Regeneration", color: "purple" },
  weight: { key: "weight", label: "Gewicht", unit: "kg", category: "Körperwerte", color: "gray" },
  calories: { key: "calories", label: "Kalorien", unit: "kcal", category: "Nutrition", color: "orange" },
  bloodPressureSystolic: { key: "bloodPressureSystolic", label: "Systolisch", unit: "mmHg", category: "Vital", color: "red" },
  bloodPressureDiastolic: { key: "bloodPressureDiastolic", label: "Diastolisch", unit: "mmHg", category: "Vital", color: "red" },
  oxygenSaturation: { key: "oxygenSaturation", label: "O₂-Sättigung", unit: "%", category: "Vital", color: "cyan" },
  bodyTemp: { key: "bodyTemp", label: "Temperatur", unit: "°C", category: "Vital", color: "orange" },
  respiratoryRate: { key: "respiratoryRate", label: "Atemfrequenz", unit: "/min", category: "Vital", color: "teal" },
  muscleMass: { key: "muscleMass", label: "Muskelmasse", unit: "kg", category: "Körperwerte", color: "green" },
  bodyFat: { key: "bodyFat", label: "Körperfett", unit: "%", category: "Körperwerte", color: "yellow" },
  bmi: { key: "bmi", label: "BMI", unit: "", category: "Körperwerte", color: "gray" },
};