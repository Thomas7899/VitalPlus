"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Activity, Utensils, Heart, Moon, ChevronDown, ChevronUp } from "lucide-react";
import type { DashboardActivityData } from "@/lib/data";

const activityIcons = {
  BLOOD_PRESSURE: { icon: Heart, bg: "bg-red-50", iconBg: "bg-red-100", text: "text-red-600" },
  MEAL: { icon: Utensils, bg: "bg-orange-50", iconBg: "bg-orange-100", text: "text-orange-600" },
  WORKOUT: { icon: Activity, bg: "bg-blue-50", iconBg: "bg-blue-100", text: "text-blue-600" },
  SLEEP_WARNING: { icon: Moon, bg: "bg-purple-50", iconBg: "bg-purple-100", text: "text-purple-600" },
  DEFAULT: { icon: Activity, bg: "bg-gray-50", iconBg: "bg-gray-100", text: "text-gray-600" },
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DashboardActivities({ userId }: { userId: string }) {
  const [showAll, setShowAll] = useState(false);

  const { data: activities, error, isLoading, mutate } = useSWR<DashboardActivityData>(
    `/api/health/activities?userId=${userId}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  useEffect(() => {
    mutate();
  }, [mutate]);

  if (error)
    return (
      <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800">
            <Calendar className="mr-2 h-5 w-5" />
            Letzte Aktivitäten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">❌ Fehler beim Laden der Aktivitäten</p>
        </CardContent>
      </Card>
    );

  return (
    <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800">
          <Calendar className="mr-2 h-5 w-5" />
          Letzte Aktivitäten
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-slate-600">Lade Aktivitäten...</p>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {(showAll ? activities : activities.slice(0, 3)).map((activity) => {
                const config =
                  activityIcons[activity.type as keyof typeof activityIcons] ||
                  activityIcons.DEFAULT;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center space-x-4 p-4 ${config.bg} rounded-xl transition hover:scale-[1.01]`}
                  >
                    <div
                      className={`w-10 h-10 ${config.iconBg} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 ${config.text}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{activity.title}</p>
                      <p className="text-sm text-slate-600">
                        {activity.description} – {activity.timeAgo}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {activities.length > 3 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      Weniger anzeigen <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Mehr anzeigen <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-600">Noch keine Aktivitäten erfasst.</p>
        )}
      </CardContent>
    </Card>
  );
}
