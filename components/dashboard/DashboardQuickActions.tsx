// components/dashboard/DashboardQuickActions.tsx
import Link from "next/link";
import { Activity, Utensils, Heart, ChevronRight } from "lucide-react";

const quickActions = [
  {
    title: "Blutdruck erfassen",
    description: "Neue Messung",
    icon: Activity,
    href: "/blutdruck",
    color: "purple",
  },
  {
    title: "Mahlzeit tracken",
    description: "Kalorien & Makros",
    icon: Utensils,
    href: "/kalorien",
    color: "orange",
  },
  {
    title: "Alle Vitalwerte",
    description: "Gesamtübersicht",
    icon: Heart,
    href: "/vitalfunktionen",
    color: "red",
  },
];

const colorClasses = {
  purple: {
    iconBg: "bg-purple-500/20 dark:bg-purple-400/20",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    iconBg: "bg-orange-500/20 dark:bg-orange-400/20",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  red: {
    iconBg: "bg-red-500/20 dark:bg-red-400/20",
    iconColor: "text-red-600 dark:text-red-400",
  },
};

export function DashboardQuickActions() {
  return (
    <div className="space-y-3">
      {quickActions.map((action, index) => {
        const colors = colorClasses[action.color as keyof typeof colorClasses];
        
        return (
          <Link key={index} href={action.href}>
            <div className="group flex items-center justify-between p-4 rounded-xl 
                          bg-white/50 dark:bg-slate-800/50 
                          border border-slate-200/60 dark:border-slate-700/50
                          hover:bg-white/80 dark:hover:bg-slate-800/80
                          hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${colors.iconBg} 
                              flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <action.icon className={`h-5 w-5 ${colors.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}