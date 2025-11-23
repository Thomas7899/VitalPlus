// types/health.ts
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
  | "respiratoryRate";

export interface Metric {
  key: MetricKey;
  label: string;
  unit: string;
  color?: string;
  category?: "Activity" | "Vital" | "Regeneration" | "Nutrition" | "Fitness" | "Vitalwerte";
}

export interface HealthDataPoint {
  id: string;
  date: string | Date;
  // Optionale Werte, da nicht jeder Datensatz alles hat
  steps?: number;
  heartRate?: number;
  weight?: number;
  sleepHours?: number;
  calories?: number;
  bodyTemp?: number;
  // Index Signature für dynamischen Zugriff in Charts (d[metric.key])
  [key: string]: any; 
}

export interface DashboardTrendData {
  id: string;
  title: string;
  value: string;
  change: string;
  color: string;
  icon: LucideIcon;
}