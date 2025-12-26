// components/health/HealthAlerts.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, Brain, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function HealthAlerts({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const checkAlerts = async () => {
    if (!userId || isPending) return;
    setLoading(true);
    try {
      const res = await fetch("/api/health/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Laden der Alerts");
      startTransition(() => {
        setAlerts(data.alerts || []);
        setRecommendation(data.recommendation || null);
      });
    } catch (error) {
      console.error(error);
      startTransition(() => {
        setAlerts(["⚠️ Gesundheitsdaten konnten nicht analysiert werden."]);
      });
    } finally {
      setLoading(false);
      setChecked(true);
    }
  };

  useEffect(() => {
    checkAlerts();
  }, [userId]);

  const busy = loading || isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" />
          <span>Gesundheits-Alerts</span>
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={checkAlerts}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Analysiere...
            </>
          ) : (
            "Neu prüfen"
          )}
        </Button>
      </div>

      {busy && (
        <p className="text-muted-foreground text-sm">Prüfe aktuelle Gesundheitsdaten...</p>
      )}

      {!busy && checked && alerts.length === 0 && (
        <Card className="border-l-4 border-l-green-500 bg-green-50/40 dark:bg-green-950/30">
          <CardHeader>
            <CardTitle className="text-green-600">Alles im grünen Bereich 🌿</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Keine Auffälligkeiten in den letzten Tagen.
          </CardContent>
        </Card>
      )}

      {!busy && alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={cn("border-l-4 border-l-yellow-500 bg-yellow-50/40 dark:bg-yellow-950/30")}>
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="text-yellow-500" />
              <CardTitle>Wichtige Hinweise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              {alerts.map((a, i) => (
                <p key={i}>{a}</p>
              ))}
            </CardContent>
          </Card>

          {recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-4"
            >
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/30">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Brain className="text-blue-500" />
                  <CardTitle>KI-Empfehlung für heute</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                  <ReactMarkdown>{recommendation}</ReactMarkdown>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}