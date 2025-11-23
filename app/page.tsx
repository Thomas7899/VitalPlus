// app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardActivities } from "@/components/dashboard/DashboardActivities";
import { HealthInsights } from "@/components/dashboard/HealthInsights";
import { DailyPlan } from "@/components/health/DailyPlan";
import { HealthAlerts } from "@/components/health/HealthAlerts";
import { getDashboardStats } from "@/lib/data";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

async function StatsData({ userId }: { userId: string }) {
  const statsData = await getDashboardStats(userId);
  const stats = statsData || {
    steps: "0", stepsChange: "0%",
    calories: "0", caloriesChange: "0%",
    heartRate: "0", heartRateChange: "0%",
    sleep: "0", sleepChange: "0%",
  };
  return <DashboardStats stats={stats} />;
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <DashboardHeader />

      <Suspense fallback={<DashboardSkeleton />}>
        <StatsData userId={userId} />
      </Suspense>

      <HealthAlerts userId={userId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <HealthInsights userId={userId} />
          <DashboardActivities userId={userId} />
        </div>

        <div className="space-y-8">
          <DashboardQuickActions />
          <DailyPlan userId={userId} />
        </div>
      </div>
    </div>
  );
}