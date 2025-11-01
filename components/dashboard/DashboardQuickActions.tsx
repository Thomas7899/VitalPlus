import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Activity, Utensils, Heart } from "lucide-react";

const quickActions = [
  {
    title: "Blutdruck messen",
    description: "Neue Messung hinzufügen",
    icon: Activity,
    href: "/blutdruck",
    color: "purple",
  },
  {
    title: "Mahlzeit eingeben",
    description: "Kalorien tracken",
    icon: Utensils,
    href: "/kalorien",
    color: "orange",
  },
  {
    title: "Gesundheitsdaten",
    description: "Alle Werte anzeigen",
    icon: Heart,
    href: "/gesundheit",
    color: "red",
  },
];

export function DashboardQuickActions() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Schnellzugriff</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Link key={index} href={action.href}>
            <Card
              className={`
                border-0 shadow-lg shadow-slate-200/50 
                hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group
                backdrop-blur-sm 
                ${
                  action.color === "purple"
                    ? "bg-gradient-to-br from-purple-50 to-purple-100/70 hover:from-purple-100 hover:to-purple-200"
                    : action.color === "orange"
                    ? "bg-gradient-to-br from-orange-50 to-orange-100/70 hover:from-orange-100 hover:to-orange-200"
                    : "bg-gradient-to-br from-red-50 to-red-100/70 hover:from-red-100 hover:to-red-200"
                }
              `}
            >
              <CardHeader className="pb-3">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                    action.color === "purple"
                      ? "from-purple-400 to-purple-600"
                      : action.color === "orange"
                      ? "from-orange-400 to-orange-600"
                      : "from-red-400 to-red-600"
                  } flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-slate-800">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{action.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
