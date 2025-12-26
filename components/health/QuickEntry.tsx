// components/health/QuickEntry.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Utensils,
  Heart,
  Footprints,
  Moon,
  Loader2,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

interface QuickEntryProps {
  userId: string;
}

interface QuickPreset {
  id: string;
  label: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  data: Record<string, number | string>;
  description: string;
}

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "breakfast-light",
    label: "Leichtes Frühstück",
    emoji: "🥣",
    icon: Utensils,
    color: "orange",
    data: { calories: 300, mealType: "Frühstück" },
    description: "~300 kcal",
  },
  {
    id: "lunch-normal",
    label: "Normales Mittagessen",
    emoji: "🍽️",
    icon: Utensils,
    color: "orange",
    data: { calories: 600, mealType: "Mittagessen" },
    description: "~600 kcal",
  },
  {
    id: "dinner-normal",
    label: "Normales Abendessen",
    emoji: "🥘",
    icon: Utensils,
    color: "orange",
    data: { calories: 500, mealType: "Abendessen" },
    description: "~500 kcal",
  },
  {
    id: "snack",
    label: "Snack",
    emoji: "🍎",
    icon: Utensils,
    color: "orange",
    data: { calories: 150, mealType: "Snacks" },
    description: "~150 kcal",
  },
  {
    id: "bp-normal",
    label: "Blutdruck Normal",
    emoji: "💓",
    icon: Heart,
    color: "red",
    data: { bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72 },
    description: "120/80 mmHg",
  },
  {
    id: "bp-elevated",
    label: "Blutdruck Erhöht",
    emoji: "❤️‍🔥",
    icon: Heart,
    color: "red",
    data: { bloodPressureSystolic: 135, bloodPressureDiastolic: 85, heartRate: 78 },
    description: "135/85 mmHg",
  },
  {
    id: "steps-moderate",
    label: "Moderater Tag",
    emoji: "🚶",
    icon: Footprints,
    color: "blue",
    data: { steps: 6000 },
    description: "6.000 Schritte",
  },
  {
    id: "steps-active",
    label: "Aktiver Tag",
    emoji: "🏃",
    icon: Footprints,
    color: "blue",
    data: { steps: 10000 },
    description: "10.000 Schritte",
  },
  {
    id: "sleep-good",
    label: "Guter Schlaf",
    emoji: "😴",
    icon: Moon,
    color: "purple",
    data: { sleepHours: 7.5 },
    description: "7,5 Stunden",
  },
  {
    id: "sleep-short",
    label: "Kurzer Schlaf",
    emoji: "😪",
    icon: Moon,
    color: "purple",
    data: { sleepHours: 5.5 },
    description: "5,5 Stunden",
  },
];

export function QuickEntry({ userId }: QuickEntryProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const saveQuickEntry = async (preset: QuickPreset) => {
    setSavingId(preset.id);

    try {
      const response = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: new Date().toISOString(),
          ...preset.data,
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern");

      // Markiere als gespeichert
      setSavedIds((prev) => new Set(prev).add(preset.id));
      
      // Entferne Markierung nach 3 Sekunden
      setTimeout(() => {
        setSavedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(preset.id);
          return newSet;
        });
      }, 3000);

      // SWR Cache aktualisieren
      mutate(`/api/health?userId=${userId}`);
      
      toast.success(`${preset.emoji} ${preset.label} gespeichert!`);
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setSavingId(null);
    }
  };

  // Gruppiere Presets nach Typ
  const foodPresets = QUICK_PRESETS.filter((p) => p.color === "orange");
  const healthPresets = QUICK_PRESETS.filter((p) => p.color === "red");
  const activityPresets = QUICK_PRESETS.filter((p) => p.color === "blue" || p.color === "purple");

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/90 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-50">
          <Zap className="h-5 w-5 text-yellow-400" />
          Schnelleingabe
        </CardTitle>
        <p className="text-sm text-slate-400">
          Ein Klick – Daten gespeichert
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ernährung */}
        <div>
          <h3 className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-1">
            <Utensils className="h-3 w-3" /> Ernährung
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {foodPresets.map((preset) => (
              <QuickButton
                key={preset.id}
                preset={preset}
                isSaving={savingId === preset.id}
                isSaved={savedIds.has(preset.id)}
                onSave={() => saveQuickEntry(preset)}
              />
            ))}
          </div>
        </div>

        {/* Gesundheit */}
        <div>
          <h3 className="text-xs font-medium text-red-400 mb-2 flex items-center gap-1">
            <Heart className="h-3 w-3" /> Blutdruck
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {healthPresets.map((preset) => (
              <QuickButton
                key={preset.id}
                preset={preset}
                isSaving={savingId === preset.id}
                isSaved={savedIds.has(preset.id)}
                onSave={() => saveQuickEntry(preset)}
              />
            ))}
          </div>
        </div>

        {/* Aktivität */}
        <div>
          <h3 className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-1">
            <Footprints className="h-3 w-3" /> Aktivität & Schlaf
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {activityPresets.map((preset) => (
              <QuickButton
                key={preset.id}
                preset={preset}
                isSaving={savingId === preset.id}
                isSaved={savedIds.has(preset.id)}
                onSave={() => saveQuickEntry(preset)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickButton({
  preset,
  isSaving,
  isSaved,
  onSave,
}: {
  preset: QuickPreset;
  isSaving: boolean;
  isSaved: boolean;
  onSave: () => void;
}) {
  return (
    <Button
      variant="outline"
      className={`h-auto py-2 px-3 flex flex-col items-start gap-0.5 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-all ${
        isSaved ? "border-green-500 bg-green-500/10" : ""
      }`}
      onClick={onSave}
      disabled={isSaving}
    >
      <div className="flex items-center gap-2 w-full">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : isSaved ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <span className="text-base">{preset.emoji}</span>
        )}
        <span className="text-xs font-medium text-slate-200 truncate">
          {preset.label}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 pl-6">
        {preset.description}
      </span>
    </Button>
  );
}
