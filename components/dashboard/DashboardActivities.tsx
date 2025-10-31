import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Activity, Utensils } from "lucide-react";

export function DashboardActivities() {
  return (
    <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800">
          <Calendar className="mr-2 h-5 w-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">Blutdruck gemessen</p>
              <p className="text-sm text-slate-600">120/80 mmHg - vor 2 Stunden</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Utensils className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">Mittagessen erfasst</p>
              <p className="text-sm text-slate-600">650 Kalorien - vor 3 Stunden</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
