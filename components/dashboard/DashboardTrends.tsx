// components/dashboard/DashboardTrends.tsx
import { HealthInsights } from "@/components/health/HealthInsights";
import type { DashboardTrendData } from "@/types/health";
import { TrendCard } from "./TrendCard";

export function DashboardTrends({
  trends,
  userId,
}: {
  trends: DashboardTrendData[];
  userId: string;
}) {
  return (
    <div className="space-y-10">
      <HealthInsights userId={userId} />
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Aktuelle Trends
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trends.map((trend) => (
            <TrendCard key={trend.id} trend={trend} />
          ))}
        </div>
      </div>
    </div>
  );
}
