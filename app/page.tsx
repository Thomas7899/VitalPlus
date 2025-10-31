import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { DashboardTrends } from "@/components/dashboard/DashboardTrends";
import { DashboardActivities } from "@/components/dashboard/DashboardActivities";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 space-y-10">
      <DashboardHeader />
      <DashboardStats />
      <DashboardQuickActions />
      <DashboardTrends userId={userId} />
      <DashboardActivities />
    </div>
  );
}
