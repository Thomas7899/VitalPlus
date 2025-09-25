export const metrics = [
    { key: "steps", label: "Schritte", color: "#4F46E5", category: "Fitness" },
    { key: "heartRate", label: "Herzfrequenz", color: "#EF4444", category: "Vitalwerte" },
    { key: "respiratoryRate", label: "Atemfrequenz", color: "#F472B6", category: "Vitalwerte" },
    { key: "oxygenSaturation", label: "Sauerstoffsättigung", color: "#34D399", category: "Vitalwerte" },
    { key: "sleepHours", label: "Schlafstunden", color: "#10B981", category: "Körperwerte" },
    { key: "bodyTemp", label: "Körpertemperatur", color: "#EF7F24", category: "Körperwerte" },
        { key: "weight", label: "Gewicht", color: "#F97316", category: "Körperwerte" },
    { key: "bmi", label: "BMI", color: "#6366F1", category: "Körperwerte" },
    { key: "muscleMass", label: "Muskelmasse", color: "#6B7280", category: "Körperwerte" },
    { key: "bodyFat", label: "Körperfettanteil", color: "#EC4899", category: "Körperwerte" },
  ] as const;
  
  export const categories = [...new Set(metrics.map((m) => m.category))];