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
    <div className="container mx-auto max-w-6xl space-y-10 px-4 pb-12 pt-6">
      <DashboardHeader />

      <div className="surface-panel p-6 sm:p-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <StatsData userId={userId} />
        </Suspense>
      </div>

      <AICockpit userId={userId} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="glass-panel p-6 sm:p-8">
          <h2 className="section-title">Letzte Aktivitäten</h2>
          <DashboardActivities userId={userId} />
        </section>

        <section className="glass-panel p-6 sm:p-8">
          <h2 className="section-title">Schnellzugriffe</h2>
          <DashboardQuickActions />
        </section>
      </div>
    </div>
  );
}