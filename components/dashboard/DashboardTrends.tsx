"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge, TrendingUp, Activity, Moon } from "lucide-react";
import { HealthInsights } from "@/components/health/HealthInsights";

const trendStats = [
  { title: "Blutdruck", value: "120/80 mmHg", change: "Stabil", color: "purple", icon: Gauge },
  { title: "Stresslevel", value: "Niedrig", change: "-8%", color: "blue", icon: TrendingUp },
  { title: "Energielevel", value: "Hoch", change: "+10%", color: "orange", icon: Activity },
  { title: "Schlafdauer", value: "7.5h", change: "+0.5h", color: "purple", icon: Moon },
];

export function DashboardTrends({ userId }: { userId: string }) {
  return (
    <div className="space-y-10">
      <HealthInsights userId={userId} className="mb-6" />
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Aktuelle Trends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendStats.map((trend, index) => (
            <Card
              key={index}
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
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      trend.color === "blue"
                        ? "from-blue-400 to-blue-600"
                        : trend.color === "orange"
                        ? "from-orange-400 to-orange-600"
                        : trend.color === "red"
                        ? "from-red-400 to-red-600"
                        : "from-purple-400 to-purple-600"
                    } flex items-center justify-center`}
                  >
                    <trend.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
