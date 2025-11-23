// components/dashboard/TrendCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardTrendData } from "@/types/health";

const colorMap = {
  blue: "from-blue-400 to-blue-600",
  orange: "from-orange-400 to-orange-600",
  red: "from-red-400 to-red-600",
  purple: "from-purple-400 to-purple-600",
};

interface TrendCardProps {
  trend: DashboardTrendData;
}

export function TrendCard({ trend }: TrendCardProps) {
  const Icon = trend.icon;
  const gradientClass = colorMap[trend.color as keyof typeof colorMap] || colorMap.purple;

  return (
    <Card
      key={trend.id}
      className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{trend.title}</p>
            <p className="text-2xl font-bold text-slate-900">{trend.value}</p>
            <p
              className={`text-sm ${
                trend.change.includes("+")
                  ? "text-green-600"
                  : trend.change.includes("-")
                  ? "text-red-500"
                  : "text-slate-500"
              }`}
            >
              {trend.change}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}