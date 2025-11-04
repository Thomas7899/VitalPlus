"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Brain, Dumbbell, Salad, Moon } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Section = {
  title: string;
  content: string;
  icon?: React.ReactNode;
  type?: "summary" | "warning" | "info";
};

export function HealthInsights({ userId }: { userId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [expanded, setExpanded] = useState(false);
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
        if (!res.ok || !data.text) throw new Error(data.error);

        const text = data.text as string;
        const parsed: Section[] = [];
        const parts = text.split(/##\s+/g).slice(1);

        for (const part of parts) {
          const [titleLine, ...rest] = part.split("\n");
          const title = titleLine.trim();
          const content = rest.join("\n").trim();

          let type: Section["type"] = "info";
          let icon: React.ReactNode | undefined;

          if (title.toLowerCase().includes("zusammenfassung")) {
            type = "summary";
            icon = <Brain className="text-blue-500" />;
          } else if (title.toLowerCase().includes("warnung")) {
            type = "warning";
            icon = <AlertTriangle className="text-yellow-500" />;
          } else if (title.toLowerCase().includes("training")) {
            icon = <Dumbbell className="text-red-500" />;
          } else if (title.toLowerCase().includes("ernährung")) {
            icon = <Salad className="text-green-500" />;
          } else if (title.toLowerCase().includes("schlaf")) {
            icon = <Moon className="text-indigo-500" />;
          }

          parsed.push({ title, content, icon, type });
        }

        setSections(parsed);
      } catch {
        setSections([
          {
            title: "Fehler",
            content: "❌ Gesundheitsanalyse konnte nicht geladen werden.",
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
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center gap-2">
                  {summary.icon}
                  <CardTitle>{summary.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  <ReactMarkdown>{summary.content}</ReactMarkdown>
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
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  {warnings.map((w, i) => (
                    <ReactMarkdown key={i}>{w.content}</ReactMarkdown>
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
                    className="hover:shadow-md transition-shadow duration-200"
                  >
                    <CardHeader className="flex flex-row items-center gap-2">
                      {s.icon}
                      <CardTitle className="text-base">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground leading-relaxed">
                      <ReactMarkdown>{s.content}</ReactMarkdown>
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
                : "Weitere Empfehlungen anzeigen"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
