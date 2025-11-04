"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Brain, Dumbbell, Salad, Moon } from "lucide-react";
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
          let className: string = "border-l-gray-400";

          switch (s.type) {
            case "summary":
              icon = <Brain className="text-blue-500" />;
              className = "border-l-blue-500";
              break;
            case "warning":
              icon = <AlertTriangle className="text-yellow-500" />;
              className = "border-l-yellow-500 bg-yellow-50/40 dark:bg-yellow-950/30";
              break;
            case "training":
              icon = <Dumbbell className="text-red-500" />;
              className = "border-l-red-500 bg-red-50/40 dark:bg-red-950/30";
              break;
            case "nutrition":
              icon = <Salad className="text-green-500" />;
              className = "border-l-green-500 bg-green-50/40 dark:bg-green-950/30";
              break;
            case "sleep":
              icon = <Moon className="text-indigo-500" />;
              className = "border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30";
              break;
            default:
              className = "border-l-gray-400";
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
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <span>KI-Gesundheitsanalyse</span>
      </h2>

      {loading ? (
        <p className="text-muted-foreground">Lade Gesundheitsanalyse...</p>
      ) : (
        <>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={cn("border-l-4", summary.className)}>
                <CardHeader className="flex flex-row items-center gap-2">
                  {summary.icon}
                  <CardTitle>{summary.title}</CardTitle>
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
              <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/40 dark:bg-yellow-950/30">
                <CardHeader className="flex flex-row items-center gap-2">
                  <AlertTriangle className="text-yellow-500" />
                  <CardTitle>Wichtige Hinweise</CardTitle>
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
                className="grid gap-6 md:grid-cols-2"
              >
                {rest.map((s, i) => (
                  <Card
                    key={i}
                    className={cn(
                      "border-l-4 hover:shadow-lg transition-shadow duration-200",
                      s.className
                    )}
                  >
                    <CardHeader className="flex flex-row items-center gap-2">
                      {s.icon}
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
              className="text-sm"
            >
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