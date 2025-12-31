//components/dashboard/HealthInsights.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Brain, Dumbbell, Salad, Moon, Sparkles, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

type SectionType = "summary" | "warning" | "nutrition" | "training" | "sleep" | "info";

type Section = {
  title: string;
  content: string;
  type: SectionType;
  icon?: React.ReactNode;
  className?: string;
};

export function HealthInsights({ userId }: { userId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/health/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            goal: "Gesund und aktiv bleiben",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.sections) {
          throw new Error(data.error || "Antwort der API war ungültig");
        }

        const apiSections = data.sections as Section[];

        const parsed: Section[] = apiSections.map((s) => {
          let icon: React.ReactNode | undefined;
          let className: string = "border-l-slate-300 dark:border-l-slate-600";

          switch (s.type) {
            case "summary":
              icon = <Brain className="text-purple-500" />;
              className = "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20";
              break;
            case "warning":
              icon = <AlertTriangle className="text-amber-500" />;
              className = "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20";
              break;
            case "training":
              icon = <Dumbbell className="text-rose-500" />;
              className = "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20";
              break;
            case "nutrition":
              icon = <Salad className="text-emerald-500" />;
              className = "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20";
              break;
            case "sleep":
              icon = <Moon className="text-indigo-500" />;
              className = "border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20";
              break;
            default:
              className = "border-l-slate-300 dark:border-l-slate-600";
          }

          return { ...s, icon, className };
        });

        setSections(parsed);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Gesundheitsanalyse konnte nicht geladen werden.";
        setSections([
          {
            title: "Fehler",
            content: `❌ ${errorMsg}`,
            type: "warning",
            icon: <AlertTriangle className="text-yellow-500" />,
            className: "border-l-yellow-500 bg-yellow-50/40 dark:bg-yellow-950/30",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const summary = sections.find((s) => s.type === "summary");
  const warnings = sections.filter((s) => s.type === "warning");
  const rest = sections.filter(
    (s) => s.type !== "summary" && s.type !== "warning"
  );

  const markdownPlugins = {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">KI-Gesundheitsanalyse</h2>
            <p className="text-sm text-muted-foreground">Personalisierte Empfehlungen basierend auf deinen Daten</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 p-6 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-500/20">
          <div className="flex gap-1">
            <span className="loading-dot w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="loading-dot w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="loading-dot w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            KI analysiert deine Gesundheitsdaten...
          </span>
        </div>
      ) : (
        <>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn("border-l-4 shadow-sm hover:shadow-md transition-shadow", summary.className)}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20">
                    {summary.icon}
                  </div>
                  <CardTitle className="text-base">{summary.title}</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                  <ReactMarkdown {...markdownPlugins}>
                    {summary.content}
                  </ReactMarkdown>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <CardTitle className="text-base">Wichtige Hinweise</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                  {warnings.map((w, i) => (
                    <ReactMarkdown key={i} {...markdownPlugins}>
                      {w.content}
                    </ReactMarkdown>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4 md:grid-cols-2"
              >
                {rest.map((s, i) => (
                  <Card
                    key={i}
                    className={cn(
                      "border-l-4 shadow-sm hover:shadow-md transition-all duration-200",
                      s.className
                    )}
                  >
                    <CardHeader className="flex flex-row items-center gap-3 pb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/60 dark:bg-slate-800/60">
                        {s.icon}
                      </div>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                      <ReactMarkdown {...markdownPlugins}>
                        {s.content}
                      </ReactMarkdown>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              onClick={() => setExpanded(!expanded)}
              className="text-sm gap-2 rounded-xl border-purple-200/50 dark:border-purple-500/20 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            >
              <RefreshCw className="h-4 w-4" />
              {expanded
                ? "Details ausblenden"
                : "Details und Empfehlungen anzeigen"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}