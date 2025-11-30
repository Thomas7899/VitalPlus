// components/health/DailyPlan.tsx
"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Salad, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export function DailyPlan({ userId }: { userId: string }) {
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const generatePlan = async () => {
    if (!userId || isPending) return;
    setLoading(true);
    try {
      await startTransition(async () => {
        const res = await fetch("/api/health/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            goal: "Gewicht halten und gesund ernähren",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Fehler bei der Planung");
        setPlan(data.plan);
      });
    } catch {
      setPlan("❌ Plan konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="text-amber-500" />
          <span>Tagesplan</span>
        </h2>
        <Button
          variant="outline"
          onClick={generatePlan}
          disabled={busy}
          className="text-sm"
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Plane wird erstellt...
            </>
          ) : (
            "Neuen Plan generieren"
          )}
        </Button>
      </div>

      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className={cn("border-l-4 border-l-green-500 bg-green-50/40 dark:bg-green-950/30")}>
            <CardHeader className="flex flex-row items-center gap-2">
              <Salad className="text-green-500" />
              <CardTitle>Heutiger Ernährungs- & Trainingsplan</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {plan}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!plan && !busy && (
        <div className="text-muted-foreground text-sm">
          Noch kein Plan vorhanden. Klicke auf „Neuen Plan generieren“, um deinen personalisierten Tagesplan zu erhalten.
        </div>
      )}
    </div>
  );
}