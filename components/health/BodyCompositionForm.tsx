// components/health/BodyCompositionForm.tsx
// Standalone Körperzusammensetzung-Formular für kombinierte Erfassungsseite

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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  weight: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(20).max(300).optional()
  ),
  bodyFat: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(1).max(60).optional()
  ),
  muscleMass: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(10).max(150).optional()
  ),
  hydration: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(30).max(80).optional()
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface BodyCompositionFormProps {
  userId: string;
  onEntrySaved?: () => void;
}

export function BodyCompositionForm({ userId, onEntrySaved }: BodyCompositionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weight: undefined,
      bodyFat: undefined,
      muscleMass: undefined,
      hydration: undefined,
    },
  });

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      if (!userId) {
        toast.error("Bitte melde dich an, um Daten zu speichern.");
        return;
      }

      if (!data.weight && !data.bodyFat && !data.muscleMass && !data.hydration) {
        return toast.error("Bitte gib mindestens einen Wert ein.");
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
        toast.success("Körperzusammensetzung gespeichert ✅");
        mutate(`/api/health?userId=${userId}`);
        form.reset();
        onEntrySaved?.();
      } catch {
        toast.error("Speichern fehlgeschlagen.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, form, onEntrySaved]
  );

  const weight = form.watch("weight");
  const bodyFat = form.watch("bodyFat");
  const muscleMass = form.watch("muscleMass");
  const hydration = form.watch("hydration");

  return (
    <Card className="border border-border/50 bg-card/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/90 shadow-xl shadow-green-500/5 dark:shadow-emerald-500/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Körperzusammensetzung erfassen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Gewicht */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Gewicht (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="z.B. 75.5"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[70, 75, 80, 85].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-green-400 ${
                            weight === v ? "border-green-500 text-green-600 dark:text-green-300" : ""
                          }`}
                          onClick={() => form.setValue("weight", v, { shouldValidate: true })}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              {/* Körperfett */}
              <FormField
                control={form.control}
                name="bodyFat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Körperfett (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="z.B. 18.5"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[15, 18, 22, 25].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-yellow-400 ${
                            bodyFat === v ? "border-yellow-500 text-yellow-600 dark:text-yellow-300" : ""
                          }`}
                          onClick={() => form.setValue("bodyFat", v, { shouldValidate: true })}
                        >
                          {v}%
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              {/* Muskelmasse */}
              <FormField
                control={form.control}
                name="muscleMass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Muskelmasse (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="z.B. 35"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[30, 35, 40, 45].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-purple-400 ${
                            muscleMass === v ? "border-purple-500 text-purple-600 dark:text-purple-300" : ""
                          }`}
                          onClick={() => form.setValue("muscleMass", v, { shouldValidate: true })}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              {/* Hydration */}
              <FormField
                control={form.control}
                name="hydration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Hydration (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        placeholder="z.B. 55"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {[50, 55, 60, 65].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-cyan-400 ${
                            hydration === v ? "border-cyan-500 text-cyan-600 dark:text-cyan-300" : ""
                          }`}
                          onClick={() => form.setValue("hydration", v, { shouldValidate: true })}
                        >
                          {v}%
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              <span>Aktuelle Werte:</span>
              {weight && <span className="text-foreground">⚖️ {weight} kg</span>}
              {bodyFat && <span className="text-foreground">📊 {bodyFat}% Körperfett</span>}
              {muscleMass && <span className="text-foreground">💪 {muscleMass} kg Muskeln</span>}
              {hydration && <span className="text-foreground">💧 {hydration}% Hydration</span>}
              {!weight && !bodyFat && !muscleMass && !hydration && (
                <span>Noch keine Eingabe.</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !userId}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(16,185,129,0.35)] hover:brightness-110"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Speichern..." : "Körperzusammensetzung speichern"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
