// components/dashboard/DashboardQuickActions.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Activity, Utensils, Heart, ChevronRight } from "lucide-react";

const quickActions = [
  {
    title: "Blutdruck erfassen",
    description: "Neue Messung",
    icon: Activity,
    href: "/blutdruck",
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "Mahlzeit tracken",
    description: "Kalorien & Makros",
    icon: Utensils,
    href: "/kalorien",
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    title: "Alle Vitalwerte",
    description: "Gesamtübersicht",
    icon: Heart,
    href: "/vitalfunktionen",
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
];

export function DashboardQuickActions() {
  return (
    <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Schnellzugriff</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group">
              
              <div className="flex items-center gap-4">
                {/* Icon Box */}
                <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center transition-colors`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                
                {/* Text */}
                <div>
                  <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Pfeil rechts */}
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}