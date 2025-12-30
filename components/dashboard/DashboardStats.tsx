// components/dashboard/DashboardStats.tsx
import { TrendingUp, Heart, Footprints, Flame } from "lucide-react";
import type { DashboardStatsData } from "@/lib/data";

const statsConfig = [
  { id: "steps", title: "Heutige Schritte", unit: "", color: "blue", icon: Footprints },
  { id: "calories", title: "Kalorienverbrauch", unit: "", color: "orange", icon: Flame },
  { id: "heartRate", title: "Herzfrequenz", unit: "bpm", color: "red", icon: Heart },
  { id: "sleep", title: "Schlafqualität", unit: "h", color: "purple", icon: TrendingUp },
];

const colorClasses = {
  blue: {
    iconBg: "bg-blue-500/20 dark:bg-blue-400/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    glow: "shadow-blue-500/20",
  },
  orange: {
    iconBg: "bg-orange-500/20 dark:bg-orange-400/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    glow: "shadow-orange-500/20",
  },
  red: {
    iconBg: "bg-red-500/20 dark:bg-red-400/20",
    iconColor: "text-red-600 dark:text-red-400",
    glow: "shadow-red-500/20",
  },
  purple: {
    iconBg: "bg-purple-500/20 dark:bg-purple-400/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    glow: "shadow-purple-500/20",
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {displayStats.map((stat) => {
        const colors = colorClasses[stat.color as keyof typeof colorClasses];
        const isPositive = stat.change.includes("+");
        const isNegative = stat.change.includes("-");
        
        return (
          <div
            key={stat.id}
            className="group relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl 
                       bg-white/50 dark:bg-slate-800/50 
                       border border-slate-200/60 dark:border-slate-700/50
                       hover:bg-white/80 dark:hover:bg-slate-800/80
                       hover:shadow-lg transition-all duration-300"
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${colors.iconBg} 
                            flex items-center justify-center transition-transform group-hover:scale-110`}>
              <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.iconColor}`} />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-foreground">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-sm text-muted-foreground">{stat.unit}</span>
                )}
              </div>
              <p className={`text-xs font-medium ${
                isPositive ? "text-emerald-600 dark:text-emerald-400" 
                : isNegative ? "text-red-500 dark:text-red-400" 
                : "text-muted-foreground"
              }`}>
                {stat.change}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}