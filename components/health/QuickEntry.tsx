// components/health/QuickEntry.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <section className="surface-panel p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Schnelleingabe</h2>
          <p className="text-sm text-muted-foreground">Ein Klick – Daten gespeichert</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {/* Ernährung */}
        <div className="quick-entry-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
              <Utensils className="h-3.5 w-3.5 text-orange-500" />
            </div>
            Ernährung
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
        <div className="quick-entry-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
            </div>
            Blutdruck
          </h3>
          <div className="grid grid-cols-1 gap-2">
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
        <div className="quick-entry-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Footprints className="h-3.5 w-3.5 text-blue-500" />
            </div>
            Aktivität & Schlaf
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
      </div>
    </section>
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
      variant="ghost"
      className={`h-auto py-2.5 px-3 flex flex-col items-start gap-0.5 
        bg-white/60 dark:bg-slate-800/60 
        border border-slate-200/60 dark:border-slate-700/50
        hover:bg-white dark:hover:bg-slate-800 
        hover:border-slate-300 dark:hover:border-slate-600
        hover:shadow-md
        rounded-xl transition-all duration-200 ${
        isSaved ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-500/50" : ""
      }`}
      onClick={onSave}
      disabled={isSaving}
    >
      <div className="flex items-center gap-2 w-full">
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : isSaved ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <span className="text-base">{preset.emoji}</span>
        )}
        <span className="text-xs font-medium text-foreground truncate">
          {preset.label}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground pl-6">
        {preset.description}
      </span>
    </Button>
  );
}
