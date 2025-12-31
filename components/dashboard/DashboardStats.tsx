// components/dashboard/DashboardStats.tsx
import { TrendingUp, Heart, Footprints, Flame } from "lucide-react";
import type { DashboardStatsData } from "@/lib/data";

const statsConfig = [
  { id: "steps", title: "Heutige Schritte", unit: "", color: "blue", icon: Footprints },
  { id: "calories", title: "Kalorienverbrauch", unit: "", color: "orange", icon: Flame },
  { id: "heartRate", title: "Herzfrequenz", unit: "bpm", color: "rose", icon: Heart },
  { id: "sleep", title: "Schlafqualität", unit: "h", color: "violet", icon: TrendingUp },
];

const colorClasses = {
  blue: {
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/25",
    badge: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  },
  orange: {
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    glow: "shadow-orange-500/25",
    badge: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  },
  rose: {
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-500",
    glow: "shadow-rose-500/25",
    badge: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  },
  violet: {
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    glow: "shadow-violet-500/25",
    badge: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  },
};

export function DashboardStats({ stats }: { stats: DashboardStatsData }) {
  const displayStats = [
    { ...statsConfig[0], value: stats.steps, change: stats.stepsChange },
    { ...statsConfig[1], value: stats.calories, change: stats.caloriesChange },
    { ...statsConfig[2], value: stats.heartRate, change: stats.heartRateChange },
    { ...statsConfig[3], value: stats.sleep, change: stats.sleepChange },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {displayStats.map((stat) => {
        const colors = colorClasses[stat.color as keyof typeof colorClasses];
        const isPositive = stat.change.includes("+");
        const isNegative = stat.change.includes("-");
        
        return (
          <div
            key={stat.id}
            className="group relative flex flex-col gap-3 p-4 rounded-2xl 
                       bg-white/70 dark:bg-slate-800/70 
                       border border-slate-200/60 dark:border-slate-700/40
                       hover:bg-white dark:hover:bg-slate-800
                       hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50
                       transition-all duration-300"
          >
            {/* Header mit Icon */}
            <div className="flex items-center justify-between">
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${colors.iconBg} shadow-lg ${colors.glow}
                              flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                : isNegative ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" 
                : colors.badge
              }`}>
                {stat.change}
              </span>
            </div>
            
            {/* Content */}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">{stat.title}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-sm text-muted-foreground">{stat.unit}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}