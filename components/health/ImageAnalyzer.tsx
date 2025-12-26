// components/health/ImageAnalyzer.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  Upload,
  Loader2,
  Utensils,
  Heart,
  Scale,
  Sparkles,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type AnalysisType = "food" | "blood_pressure" | "weight" | "general";

interface FoodAnalysis {
  detected: boolean;
  confidence?: number;
  items?: Array<{
    name: string;
    portion: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>;
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  mealType?: string;
  healthScore?: number;
  notes?: string;
  error?: string;
}

interface BloodPressureAnalysis {
  detected: boolean;
  confidence?: number;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  category?: string;
  categoryColor?: string;
  notes?: string;
  error?: string;
}

interface WeightAnalysis {
  detected: boolean;
  confidence?: number;
  weight?: number;
  unit?: string;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  notes?: string;
  error?: string;
}

type AnalysisResult = FoodAnalysis | BloodPressureAnalysis | WeightAnalysis;

interface ImageAnalyzerProps {
  onDataExtracted?: (data: {
    type: AnalysisType;
    values: Record<string, number | string | undefined>;
  }) => void;
  defaultType?: AnalysisType;
}

const ANALYSIS_TYPES = [
  { id: "food" as const, label: "Essen", icon: Utensils, color: "orange" },
  { id: "blood_pressure" as const, label: "Blutdruck", icon: Heart, color: "red" },
  { id: "weight" as const, label: "Gewicht", icon: Scale, color: "blue" },
  { id: "general" as const, label: "Auto", icon: Sparkles, color: "purple" },
];

export function ImageAnalyzer({ onDataExtracted, defaultType = "general" }: ImageAnalyzerProps) {
  const [selectedType, setSelectedType] = useState<AnalysisType>(defaultType);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Bitte wähle ein Bild aus");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Bild ist zu groß (max 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const analyzeImage = async () => {
    if (!imagePreview) {
      toast.error("Bitte zuerst ein Bild auswählen");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/health/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePreview,
          type: selectedType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analyse fehlgeschlagen");
      }

      setAnalysisResult(data.analysis);

      if (data.analysis.detected) {
        toast.success("Analyse erfolgreich! 🎉");
      } else {
        toast.warning(data.analysis.error || "Keine Daten erkannt");
      }
    } catch (error) {
      console.error("Analyse-Fehler:", error);
      toast.error(error instanceof Error ? error.message : "Analyse fehlgeschlagen");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseData = () => {
    if (!analysisResult?.detected || !onDataExtracted) return;

    if ("totalCalories" in analysisResult && analysisResult.totalCalories) {
      onDataExtracted({
        type: "food",
        values: {
          calories: analysisResult.totalCalories,
          mealType: analysisResult.mealType,
          notes: analysisResult.items?.map(i => `${i.name} (${i.portion})`).join(", "),
        },
      });
    } else if ("systolic" in analysisResult && analysisResult.systolic) {
      onDataExtracted({
        type: "blood_pressure",
        values: {
          systolic: analysisResult.systolic,
          diastolic: analysisResult.diastolic,
          pulse: analysisResult.pulse,
        },
      });
    } else if ("weight" in analysisResult && analysisResult.weight) {
      onDataExtracted({
        type: "weight",
        values: {
          weight: analysisResult.weight,
          bodyFat: analysisResult.bodyFat,
          muscleMass: analysisResult.muscleMass,
          bmi: analysisResult.bmi,
        },
      });
    }

    toast.success("Daten übernommen!");
    resetAnalyzer();
  };

  const resetAnalyzer = () => {
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/90 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-50">
          <Camera className="h-5 w-5 text-primary" />
          KI Foto-Analyse
        </CardTitle>
        <p className="text-sm text-slate-400">
          Fotografiere Essen, Blutdruckmessgeräte oder Waagen
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analyse-Typ Auswahl */}
        <div className="flex flex-wrap gap-2">
          {ANALYSIS_TYPES.map((type) => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.id)}
              className={`gap-1.5 ${
                selectedType === type.id
                  ? `bg-${type.color}-600 hover:bg-${type.color}-700`
                  : "bg-slate-800/50 border-slate-700"
              }`}
            >
              <type.icon className="h-4 w-4" />
              {type.label}
            </Button>
          ))}
        </div>

        {/* Bild-Vorschau oder Upload */}
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Vorschau"
              className="w-full h-48 object-cover rounded-xl border border-slate-700"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={resetAnalyzer}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            {/* Kamera-Button */}
            <Button
              variant="outline"
              className="flex-1 h-24 flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-6 w-6 text-primary" />
              <span className="text-xs">Kamera</span>
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Galerie-Button */}
            <Button
              variant="outline"
              className="flex-1 h-24 flex-col gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-xs">Galerie</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Analyse-Button */}
        {imagePreview && !analysisResult && (
          <Button
            onClick={analyzeImage}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Mit KI analysieren
              </>
            )}
          </Button>
        )}

        {/* Analyse-Ergebnis */}
        {analysisResult && (
          <div className="space-y-3">
            {analysisResult.detected ? (
              <>
                {/* Food Results */}
                {"totalCalories" in analysisResult && (
                  <div className="rounded-xl bg-orange-500/10 border border-orange-500/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Utensils className="h-5 w-5 text-orange-400" />
                      <span className="font-medium text-orange-400">Erkannte Mahlzeit</span>
                      <span className="ml-auto text-xs bg-orange-500/20 px-2 py-0.5 rounded-full">
                        {Math.round((analysisResult.confidence || 0) * 100)}% sicher
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {analysisResult.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>{item.name} ({item.portion})</span>
                          <span className="text-orange-400">{item.calories} kcal</span>
                        </div>
                      ))}
                      <div className="pt-2 mt-2 border-t border-orange-500/20 flex justify-between font-semibold">
                        <span className="text-slate-200">Gesamt</span>
                        <span className="text-orange-400">{analysisResult.totalCalories} kcal</span>
                      </div>
                      {analysisResult.notes && (
                        <p className="text-xs text-slate-400 mt-2">{analysisResult.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Blood Pressure Results */}
                {"systolic" in analysisResult && analysisResult.systolic && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="h-5 w-5 text-red-400" />
                      <span className="font-medium text-red-400">Erkannter Blutdruck</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-3xl font-bold text-slate-100">
                      <span>{analysisResult.systolic}</span>
                      <span className="text-slate-500">/</span>
                      <span>{analysisResult.diastolic}</span>
                      <span className="text-lg text-slate-400">mmHg</span>
                    </div>
                    {analysisResult.pulse && (
                      <div className="text-center text-sm text-slate-400 mt-2">
                        Puls: {analysisResult.pulse} bpm
                      </div>
                    )}
                    <div className={`text-center mt-3 px-3 py-1 rounded-full text-sm ${
                      analysisResult.categoryColor === "green" ? "bg-green-500/20 text-green-400" :
                      analysisResult.categoryColor === "yellow" ? "bg-yellow-500/20 text-yellow-400" :
                      analysisResult.categoryColor === "orange" ? "bg-orange-500/20 text-orange-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>
                      {analysisResult.category}
                    </div>
                  </div>
                )}

                {/* Weight Results */}
                {"weight" in analysisResult && analysisResult.weight && (
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Scale className="h-5 w-5 text-blue-400" />
                      <span className="font-medium text-blue-400">Erkanntes Gewicht</span>
                    </div>
                    <div className="text-center text-3xl font-bold text-slate-100">
                      {analysisResult.weight} {analysisResult.unit || "kg"}
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
                      {analysisResult.bodyFat && (
                        <div className="text-center">
                          <div className="text-slate-400">Körperfett</div>
                          <div className="text-blue-400 font-medium">{analysisResult.bodyFat}%</div>
                        </div>
                      )}
                      {analysisResult.muscleMass && (
                        <div className="text-center">
                          <div className="text-slate-400">Muskeln</div>
                          <div className="text-blue-400 font-medium">{analysisResult.muscleMass} kg</div>
                        </div>
                      )}
                      {analysisResult.bmi && (
                        <div className="text-center">
                          <div className="text-slate-400">BMI</div>
                          <div className="text-blue-400 font-medium">{analysisResult.bmi}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Übernehmen Button */}
                {onDataExtracted && (
                  <Button
                    onClick={handleUseData}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Werte übernehmen
                  </Button>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-400 text-sm">
                  {analysisResult.error || "Keine Daten erkannt. Versuche ein anderes Bild."}
                </span>
              </div>
            )}

            {/* Neues Bild Button */}
            <Button
              variant="outline"
              onClick={resetAnalyzer}
              className="w-full bg-slate-800/50 border-slate-700"
            >
              Neues Bild aufnehmen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
