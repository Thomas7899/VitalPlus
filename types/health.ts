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
  | "respiratoryRate"
  | "muscleMass"  
  | "bodyFat"    
  | "bmi";       

export interface Metric {
  key: MetricKey;
  label: string;
  unit: string;
  color?: string;
  category?: "Activity" | "Vital" | "Regeneration" | "Nutrition" | "Fitness" | "Vitalwerte" | "Körperwerte";
}

export interface HealthDataPoint {
  id: string;
  date: string | Date;
  steps?: number;
  heartRate?: number;
  weight?: number;
  sleepHours?: number;
  calories?: number;
  bodyTemp?: number;
  // Index Signature für dynamischen Zugriff
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