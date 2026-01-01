// components/health/SleepForm.tsx
// Standalone Schlaf-Formular für kombinierte Erfassungsseite

"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { mutate } from "swr";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Moon, Sun } from "lucide-react";

const formSchema = z.object({
  sleepDuration: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).max(24).optional()
  ),
  sleepQuality: z.number().min(1).max(10).optional(),
  sleepStart: z.string().optional(),
  sleepEnd: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SleepFormProps {
  userId: string;
  onEntrySaved?: () => void;
}

export function SleepForm({ userId, onEntrySaved }: SleepFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sleepDuration: undefined,
      sleepQuality: 7,
      sleepStart: "",
      sleepEnd: "",
    },
  });

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      if (!userId) {
        toast.error("Bitte melde dich an, um Daten zu speichern.");
        return;
      }

      if (!data.sleepDuration && !data.sleepStart) {
        return toast.error("Bitte gib Schlafdauer oder Schlafzeit ein.");
      }

      setIsSubmitting(true);
      try {
        const response = await fetch("/api/health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            userId,
            date: new Date().toISOString(),
          }),
        });
        if (!response.ok) throw new Error("Fehler beim Speichern.");
        toast.success("Schlafdaten gespeichert ✅");
        mutate(`/api/health?userId=${userId}`);
        form.reset({ sleepQuality: 7 });
        onEntrySaved?.();
      } catch {
        toast.error("Speichern fehlgeschlagen.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, form, onEntrySaved]
  );

  const sleepDuration = form.watch("sleepDuration");
  const sleepQuality = form.watch("sleepQuality");
  const sleepStart = form.watch("sleepStart");
  const sleepEnd = form.watch("sleepEnd");

  // Auto-calculate duration if both times are set
  const calculateDuration = useCallback(() => {
    if (sleepStart && sleepEnd) {
      const [startH, startM] = sleepStart.split(":").map(Number);
      const [endH, endM] = sleepEnd.split(":").map(Number);
      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;
      if (endMinutes < startMinutes) endMinutes += 24 * 60; // Next day
      const duration = (endMinutes - startMinutes) / 60;
      form.setValue("sleepDuration", parseFloat(duration.toFixed(1)), { shouldValidate: true });
    }
  }, [sleepStart, sleepEnd, form]);

  const getQualityEmoji = (q: number) => {
    if (q >= 9) return "😴✨";
    if (q >= 7) return "😊";
    if (q >= 5) return "😐";
    if (q >= 3) return "😔";
    return "😫";
  };

  const getQualityLabel = (q: number) => {
    if (q >= 9) return "Ausgezeichnet";
    if (q >= 7) return "Gut";
    if (q >= 5) return "Mittelmäßig";
    if (q >= 3) return "Schlecht";
    return "Sehr schlecht";
  };

  return (
    <Card className="border border-border/50 bg-card/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/90 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Moon className="h-5 w-5 text-indigo-500" />
          Schlaf erfassen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Sleep Times */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="sleepStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                      <Moon className="h-3 w-3" /> Eingeschlafen
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setTimeout(calculateDuration, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["22:00", "23:00", "00:00"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-indigo-400 ${
                            sleepStart === v ? "border-indigo-500 text-indigo-600 dark:text-indigo-300" : ""
                          }`}
                          onClick={() => {
                            form.setValue("sleepStart", v, { shouldValidate: true });
                            setTimeout(calculateDuration, 100);
                          }}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sleepEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sun className="h-3 w-3" /> Aufgewacht
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setTimeout(calculateDuration, 100);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["06:00", "07:00", "08:00"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-amber-400 ${
                            sleepEnd === v ? "border-amber-500 text-amber-600 dark:text-amber-300" : ""
                          }`}
                          onClick={() => {
                            form.setValue("sleepEnd", v, { shouldValidate: true });
                            setTimeout(calculateDuration, 100);
                          }}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sleepDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Schlafdauer (Std.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        placeholder="z.B. 7.5"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[6, 7, 8, 9].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-blue-400 ${
                            sleepDuration === v ? "border-blue-500 text-blue-600 dark:text-blue-300" : ""
                          }`}
                          onClick={() => form.setValue("sleepDuration", v, { shouldValidate: true })}
                        >
                          {v}h
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sleepQuality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Schlafqualität: {sleepQuality}/10 {getQualityEmoji(sleepQuality || 5)}
                    </FormLabel>
                    <FormControl>
                      <div className="py-4">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={[field.value || 7]}
                          onValueChange={(v) => field.onChange(v[0])}
                          className="w-full"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-center text-muted-foreground">
                      {getQualityLabel(sleepQuality || 5)}
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              <span>Zusammenfassung:</span>
              {sleepStart && <span className="text-foreground">🌙 {sleepStart}</span>}
              {sleepEnd && <span className="text-foreground">☀️ {sleepEnd}</span>}
              {sleepDuration && <span className="text-foreground">⏱️ {sleepDuration}h</span>}
              {sleepQuality && (
                <span className="text-foreground">
                  {getQualityEmoji(sleepQuality)} {sleepQuality}/10
                </span>
              )}
              {!sleepStart && !sleepEnd && !sleepDuration && (
                <span>Noch keine Eingabe.</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !userId}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] hover:brightness-110"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Speichern..." : "Schlafdaten speichern"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
