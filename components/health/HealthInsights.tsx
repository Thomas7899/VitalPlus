import type { HealthInsightData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthInsightsProps {
  insights: HealthInsightData;
  className?: string;
}

export function HealthInsights({ insights, className }: HealthInsightsProps) {
  return (
    <Card className={cn("border-0 shadow-lg shadow-slate-200/50 bg-white/70 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-slate-800">
          <Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />
          {insights.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-slate-700 font-medium">{insights.insight}</p>
        <p className="text-sm text-slate-600">{insights.recommendation}</p>
      </CardContent>
    </Card>
  );
}