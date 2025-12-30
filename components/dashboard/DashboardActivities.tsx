"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Activity, Utensils, Heart, Moon, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import type { DashboardActivityData } from "@/lib/data";

const activityIcons = {
  BLOOD_PRESSURE: { 
    icon: Heart, 
    iconBg: "bg-red-500/20 dark:bg-red-400/20", 
    iconColor: "text-red-600 dark:text-red-400" 
  },
  MEAL: { 
    icon: Utensils, 
    iconBg: "bg-orange-500/20 dark:bg-orange-400/20", 
    iconColor: "text-orange-600 dark:text-orange-400" 
  },
  WORKOUT: { 
    icon: Activity, 
    iconBg: "bg-blue-500/20 dark:bg-blue-400/20", 
    iconColor: "text-blue-600 dark:text-blue-400" 
  },
  SLEEP_WARNING: { 
    icon: Moon, 
    iconBg: "bg-purple-500/20 dark:bg-purple-400/20", 
    iconColor: "text-purple-600 dark:text-purple-400" 
  },
  DEFAULT: { 
    icon: Activity, 
    iconBg: "bg-slate-500/20 dark:bg-slate-400/20", 
    iconColor: "text-slate-600 dark:text-slate-400" 
  },
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
      <div className="flex items-center justify-center py-8 text-red-500 dark:text-red-400">
        <p>Fehler beim Laden der Aktivitäten</p>
      </div>
    );

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <p>Lade Aktivitäten...</p>
      </div>
    );

  if (!activities || activities.length === 0)
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <p>Noch keine Aktivitäten erfasst.</p>
      </div>
    );

  return (
    <div className="space-y-3">
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
              className="flex items-center gap-4 p-4 rounded-xl 
                        bg-white/50 dark:bg-slate-800/50 
                        border border-slate-200/60 dark:border-slate-700/50
                        hover:bg-white/80 dark:hover:bg-slate-800/80
                        transition-all"
            >
              <div className={`w-10 h-10 ${config.iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">
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
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <>Weniger anzeigen <ChevronUp className="ml-1 h-4 w-4" /></>
            ) : (
              <>Mehr anzeigen <ChevronDown className="ml-1 h-4 w-4" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
