// components/dashboard/DashboardActivities.tsx

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Activity, Utensils, Heart } from "lucide-react"; // Heart importieren
import type { DashboardActivityData } from "@/lib/data"; // Typ importieren

// Icon-Mapping für verschiedene Aktivitätstypen
const activityIcons = {
  BLOOD_PRESSURE: { icon: Heart, bg: 'bg-purple-50', iconBg: 'bg-purple-100', text: 'text-purple-600' },
  MEAL: { icon: Utensils, bg: 'bg-orange-50', iconBg: 'bg-orange-100', text: 'text-orange-600' },
  WORKOUT: { icon: Activity, bg: 'bg-blue-50', iconBg: 'bg-blue-100', text: 'text-blue-600' },
  DEFAULT: { icon: Activity, bg: 'bg-gray-50', iconBg: 'bg-gray-100', text: 'text-gray-600' },
};

export function DashboardActivities({ activities }: { activities: DashboardActivityData }) {
  
  const getIconConfig = (type: string | null) => {
    if (type === 'BLOOD_PRESSURE') return activityIcons.BLOOD_PRESSURE;
    if (type === 'MEAL') return activityIcons.MEAL;
    if (type === 'WORKOUT') return activityIcons.WORKOUT;
    return activityIcons.DEFAULT;
  }

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
          {activities.length === 0 ? (
            <p className="text-slate-600">Noch keine Aktivitäten für heute erfasst.</p>
          ) : (
            activities.map((activity) => {
              const config = getIconConfig(activity.type);
              const Icon = config.icon;
              
              return (
                <div key={activity.id} className={`flex items-center space-x-4 p-4 ${config.bg} rounded-xl`}>
                  <div className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${config.text}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{activity.title}</p>
                    <p className="text-sm text-slate-600">{activity.description} - {activity.timeAgo}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}