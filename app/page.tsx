import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Suspense } from "react";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardTrends } from "@/components/dashboard/DashboardTrends";
import { DashboardActivities } from "@/components/dashboard/DashboardActivities";

import { 
  getDashboardStats, 
  getDashboardActivities, 
  getDashboardTrends, 
  getHealthInsightsData 
} from "@/lib/data";

async function StatsData({ userId }: { userId: string }) {

  const statsData = await getDashboardStats(userId);

  const stats = statsData || {
    steps: 0, stepsChange: 0,
    calories: 0, caloriesChange: 0,
    heartRate: 0, heartRateChange: 0,
    sleep: 0, sleepChange: 0,
  };
  return <DashboardStats stats={stats} />;
}

async function ActivitiesData({ userId }: { userId: string }) {
  const activities = await getDashboardActivities(userId);
  return <DashboardActivities activities={activities} />;
}

async function TrendsData({ userId }: { userId: string }) {
  const [trends, insightsData] = await Promise.all([
    getDashboardTrends(userId),     
    getHealthInsightsData(userId) 
  ]);
  
  return <DashboardTrends trends={trends} insightsData={insightsData} />;
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 space-y-10">
      <DashboardHeader />
      <Suspense>
        <StatsData userId={userId} />
      </Suspense>
      <DashboardQuickActions />
      <Suspense>
        <TrendsData userId={userId} />
      </Suspense>
      <Suspense>
        <ActivitiesData userId={userId} />
      </Suspense>
    </div>
  );
}