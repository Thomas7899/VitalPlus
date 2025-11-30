"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthAlerts } from "@/components/health/HealthAlerts";
import { HealthInsights } from "@/components/dashboard/HealthInsights";
import { DailyPlan } from "@/components/health/DailyPlan";
import { ShieldCheck, Brain, CalendarDays } from "lucide-react";

interface Props {
  userId: string;
}

export function AICockpit({ userId }: Props) {
  return (
    <section className="surface-panel space-y-6 p-6 sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">
          KI Center
        </p>
        <h2 className="text-2xl font-semibold text-foreground">Command Hub</h2>
        <p className="text-sm text-muted-foreground">
          Alerts, tiefere Analysen und dein persönlicher Tagesplan.
        </p>
      </div>

      <Tabs defaultValue="alerts" className="space-y-5">
        <TabsList className="grid w-full grid-cols-3 rounded-2xl border border-border/60 bg-[color:var(--tabs-surface)] p-1.5 backdrop-blur-xl">
          <TabsTrigger
            value="alerts"
            className="tab-trigger"
          >
            <ShieldCheck className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="insights" className="tab-trigger">
            <Brain className="h-4 w-4" />
            Analyse
          </TabsTrigger>
          <TabsTrigger value="plan" className="tab-trigger">
            <CalendarDays className="h-4 w-4" />
            Tagesplan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-0">
          <div className="glass-panel p-4 sm:p-6">
            <HealthAlerts userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-0">
          <div className="glass-panel p-4 sm:p-6">
            <HealthInsights userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="plan" className="mt-0">
          <div className="glass-panel p-4 sm:p-6">
            <DailyPlan userId={userId} />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}