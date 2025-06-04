export const metrics = [
    { key: "steps", label: "Schritte", color: "#4F46E5", category: "Fitness" },
    { key: "calories", label: "Kalorien", color: "#F59E0B", category: "Fitness" },
    { key: "weight", label: "Gewicht", color: "#F97316", category: "Fitness" },
    { key: "bmi", label: "BMI", color: "#6366F1", category: "Fitness" },
    { key: "muscleMass", label: "Muskelmasse", color: "#6B7280", category: "Fitness" },
    { key: "bodyFat", label: "Körperfettanteil", color: "#EC4899", category: "Fitness" },
    { key: "heartRate", label: "Herzfrequenz", color: "#EF4444", category: "Vitalwerte" },
    { key: "respiratoryRate", label: "Atemfrequenz", color: "#F472B6", category: "Vitalwerte" },
    { key: "oxygenSaturation", label: "Sauerstoffsättigung", color: "#34D399", category: "Vitalwerte" },
    { key: "bloodPressure", label: "Blutdruck", color: "#9CA3AF", category: "Vitalwerte" },
    { key: "sleepHours", label: "Schlafstunden", color: "#10B981", category: "Körperlich" },
    { key: "bodyTemp", label: "Körpertemperatur", color: "#EF7F24", category: "Körperlich" },
    { key: "medications", label: "Medikamente", color: "#D1D5DB", category: "Medikamente" },
  ] as const;
  
  export const categories = [...new Set(metrics.map((m) => m.category))];
  