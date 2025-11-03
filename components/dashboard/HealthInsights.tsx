"use client";

import { useCompletion } from "@ai-sdk/react";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";

export function HealthInsights({ userId }: { userId: string }) {
  const {
    completion,
    isLoading,
    complete,
  } = useCompletion({
    api: "/api/health/coach",
  });

  useEffect(() => {
    if (userId) {
      complete(`{
  "userId": "${userId}",
  "goal": "Gesund und aktiv bleiben"
}`);
    }
  }, [userId, complete]);

  if (isLoading && completion.length === 0) {
    return (
      <div className="text-muted-foreground">
        Lade Gesundheitsanalyse...
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-muted/50 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">🧠 KI-Gesundheitsanalyse</h2>
      <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
        <ReactMarkdown>{completion}</ReactMarkdown>
      </div>
    </div>
  );
}