"use client";

import { useEffect, useState } from "react";

interface HealthCoachResult {
  summary: string;
  warnings: string[];
  recommendations: {
    nutrition: string;
    training: string;
    recovery: string;
  };
}

export function HealthInsights({ userId }: { userId: string }) {
  const [data, setData] = useState<HealthCoachResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
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
        if (!res.ok) throw new Error("Fehler beim Laden");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);

  if (loading) return <div className="text-muted-foreground">Lade Gesundheitsanalyse...</div>;
  if (!data) return <div className="text-destructive">Keine Daten gefunden.</div>;

  return (
    <div className="p-6 rounded-2xl bg-muted/50 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">🧠 KI-Gesundheitsanalyse</h2>
      <p className="text-sm text-muted-foreground">{data.summary}</p>

      {data.warnings?.length > 0 && (
        <div>
          <h3 className="font-medium text-red-500">⚠️ Warnungen</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-2">
        <h3 className="font-medium">💪 Empfehlungen</h3>
        <p><strong>Ernährung:</strong> {data.recommendations?.nutrition}</p>
        <p><strong>Training:</strong> {data.recommendations?.training}</p>
        <p><strong>Erholung:</strong> {data.recommendations?.recovery}</p>
      </div>
    </div>
  );
}
