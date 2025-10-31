export const metrics = [
    { key: "steps", label: "Schritte", unit: "", color: "#4F46E5", category: "Fitness" },
    { key: "heartRate", label: "Herzfrequenz", unit: "bpm", color: "#EF4444", category: "Vitalwerte" },
    { key: "respiratoryRate", label: "Atemfrequenz", unit: "/min", color: "#F472B6", category: "Vitalwerte" },
    { key: "oxygenSaturation", label: "Sauerstoffsättigung", unit: "%", color: "#34D399", category: "Vitalwerte" },
    { key: "sleepHours", label: "Schlafstunden", unit: "Std.", color: "#10B981", category: "Regeneration" },
    { key: "bodyTemp", label: "Körpertemperatur", unit: "°C", color: "#F97316", category: "Körperwerte" },
    { key: "weight", label: "Gewicht", unit: "kg", color: "#F59E0B", category: "Körperwerte" },
    { key: "bmi", label: "BMI", unit: "", color: "#6366F1", category: "Körperwerte" },
    { key: "muscleMass", label: "Muskelmasse", unit: "%", color: "#6B7280", category: "Körperwerte" },
    { key: "bodyFat", label: "Körperfettanteil", unit: "%", color: "#EC4899", category: "Körperwerte" },
  ] as const;
  
  export type Metric = (typeof metrics)[number];

  export const categories = [...new Set(metrics.map((m) => m.category))];