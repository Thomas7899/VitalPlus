import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const quickStats = [
  { title: "Heutige Schritte", value: "8,247", change: "+12%", color: "blue" },
  { title: "Kalorienverbrauch", value: "2,150", change: "+5%", color: "orange" },
  { title: "Herzfrequenz", value: "72 bpm", change: "Normal", color: "red" },
  { title: "Schlafqualität", value: "7.5h", change: "+0.5h", color: "purple" },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickStats.map((stat, index) => (
        <Card
          key={index}
          className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p
                  className={`text-sm ${
                    stat.change.includes("+")
                      ? "text-green-600"
                      : stat.change.includes("-")
                      ? "text-red-500"
                      : "text-slate-500"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  stat.color === "blue"
                    ? "from-blue-400 to-blue-600"
                    : stat.color === "orange"
                    ? "from-orange-400 to-orange-600"
                    : stat.color === "red"
                    ? "from-red-400 to-red-600"
                    : "from-purple-400 to-purple-600"
                } flex items-center justify-center`}
              >
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
