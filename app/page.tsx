// app/page.tsx
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardActivities } from "@/components/dashboard/DashboardActivities";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { getDashboardStats } from "@/lib/data";
import { AICockpit } from "@/components/dashboard/AICockpit";
import { QuickEntry } from "@/components/health/QuickEntry";
import { Calendar, Zap, Activity } from "lucide-react";

async function StatsData({ userId }: { userId: string }) {
  const statsData = await getDashboardStats(userId);
  const stats = statsData || {
    steps: "0",
    stepsChange: "0%",
    calories: "0",
    caloriesChange: "0%",
    heartRate: "0",
    heartRateChange: "0%",
    sleep: "0",
    sleepChange: "0%",
  };
  return <DashboardStats stats={stats} />;
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect("/login");

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 pb-12 pt-6">
      <DashboardHeader />

      {/* Stats Section */}
      <section className="surface-panel p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Deine Statistiken</h2>
            <p className="text-sm text-muted-foreground">Heute im Überblick</p>
          </div>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <StatsData userId={userId} />
        </Suspense>
      </section>

      {/* KI Command Hub - Hervorgehoben als Hauptfeature */}
      <AICockpit userId={userId} />

      {/* Schnelleingabe */}
      <QuickEntry userId={userId} />

      {/* Bottom Grid: Aktivitäten & Schnellzugriffe */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Letzte Aktivitäten</h2>
          </div>
          <DashboardActivities userId={userId} />
        </section>

        <section className="surface-panel p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Schnellzugriff</h2>
          </div>
          <DashboardQuickActions />
        </section>
      </div>
    </div>
  );
}