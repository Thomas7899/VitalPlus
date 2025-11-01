import { HealthInsights } from "@/components/health/HealthInsights";
import type { DashboardTrendData, HealthInsightData } from "@/lib/data";
import { TrendCard } from "./TrendCard";

export function DashboardTrends({
  trends,
  insightsData,
}: {
  trends: DashboardTrendData[];
  insightsData: HealthInsightData;
}) {
  return (
    <div className="space-y-10">
      <HealthInsights insights={insightsData} className="mb-6" />
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Aktuelle Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trends.map((trend) => <TrendCard key={trend.id} trend={trend} />)}
        </div>
      </div>
    </div>
  );
}
