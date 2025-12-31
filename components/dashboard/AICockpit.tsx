"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthAlerts } from "@/components/health/HealthAlerts";
import { HealthInsights } from "@/components/dashboard/HealthInsights";
import { DailyPlan } from "@/components/health/DailyPlan";
import { ShieldCheck, Brain, CalendarDays, Sparkles } from "lucide-react";

interface Props {
  userId: string;
}

export function AICockpit({ userId }: Props) {
  return (
    <section className="ai-section p-6 sm:p-8">
      {/* Header mit AI Badge */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="ai-badge">
              <Sparkles className="h-3 w-3" />
              KI-gestützt
            </span>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            Dein Gesundheits-Copilot
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Intelligente Analysen, personalisierte Empfehlungen und dein täglicher Gesundheitsplan.
          </p>
        </div>
        
        {/* AI Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 border border-purple-200/50 dark:border-purple-500/20">
          <div className="flex gap-1">
            <span className="loading-dot w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span className="loading-dot w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span className="loading-dot w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          </div>
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Analysiert</span>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-purple-200/30 dark:border-purple-500/20 bg-white/70 dark:bg-slate-800/70 p-1.5 backdrop-blur-xl">
          <TabsTrigger
            value="alerts"
            className="tab-trigger"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="tab-trigger">
            <Brain className="h-4 w-4 ai-icon-glow" />
            <span className="hidden sm:inline">KI-Analyse</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="tab-trigger">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Tagesplan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-0">
          <div className="glass-panel p-5 sm:p-6">
            <HealthAlerts userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <div className="glass-panel p-5 sm:p-6">
            <HealthInsights userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="plan" className="mt-0">
          <div className="glass-panel p-5 sm:p-6">
            <DailyPlan userId={userId} />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}