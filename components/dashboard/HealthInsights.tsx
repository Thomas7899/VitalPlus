"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export function HealthInsights({ userId }: { userId: string }) {
  const [text, setText] = useState<string>("Lade Gesundheitsanalyse...");
  const [loading, setLoading] = useState<boolean>(false);

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

        if (res.ok) {
          setText(JSON.stringify(data, null, 2));
        } else {
          setText(`❌ Fehler: ${data.error || "Unbekannter Fehler"}`);
        }
      } catch (err) {
        setText("💥 Netzwerkfehler oder Serverfehler");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return (
    <div className="p-6 rounded-2xl bg-muted/50 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">🧠 KI-Gesundheitsanalyse</h2>
      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
        {loading ? (
          <p>Lade Gesundheitsanalyse...</p>
        ) : (
          <ReactMarkdown>{text}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}
