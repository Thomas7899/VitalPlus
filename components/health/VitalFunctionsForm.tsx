// components/health/VitalFunctionsForm.tsx
// Standalone Vitalfunktionen-Formular für kombinierte Erfassungsseite

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
  heartRate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int().min(20).max(250).optional()
  ),
  respiratoryRate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int().min(5).max(60).optional()
  ),
  oxygenSaturation: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(50).max(100).optional()
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface VitalFunctionsFormProps {
  userId: string;
  onEntrySaved?: () => void;
}

export function VitalFunctionsForm({ userId, onEntrySaved }: VitalFunctionsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heartRate: undefined,
      respiratoryRate: undefined,
      oxygenSaturation: undefined,
    },
  });

  const handleSubmit = useCallback(
    async (data: FormValues) => {
      if (!userId) {
        toast.error("Bitte melde dich an, um Daten zu speichern.");
        return;
      }

      if (!data.heartRate && !data.respiratoryRate && !data.oxygenSaturation) {
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
        toast.success("Vitaldaten gespeichert ✅");
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

  const heartRate = form.watch("heartRate");
  const respiratoryRate = form.watch("respiratoryRate");
  const oxygenSaturation = form.watch("oxygenSaturation");

  return (
    <Card className="border border-border/50 bg-card/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/90 shadow-xl shadow-red-500/5 dark:shadow-purple-500/10 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Vitalfunktionen schnell erfassen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Herzfrequenz */}
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Herzfrequenz (bpm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="z.B. 60"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[55, 65, 80].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-red-400 ${
                            heartRate === v ? "border-red-500 text-red-600 dark:text-red-300" : ""
                          }`}
                          onClick={() => form.setValue("heartRate", v, { shouldValidate: true })}
                        >
                          {v} bpm
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Atemfrequenz */}
              <FormField
                control={form.control}
                name="respiratoryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Atemfrequenz (pro Min.)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="z.B. 16"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[12, 16, 20].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-cyan-400 ${
                            respiratoryRate === v ? "border-cyan-500 text-cyan-600 dark:text-cyan-300" : ""
                          }`}
                          onClick={() => form.setValue("respiratoryRate", v, { shouldValidate: true })}
                        >
                          {v}/min
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              
              {/* SpO2 */}
              <FormField
                control={form.control}
                name="oxygenSaturation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Sauerstoffsättigung (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="z.B. 98"
                        className="rounded-2xl bg-secondary/50 border-border text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[96, 98, 100].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-blue-400 ${
                            oxygenSaturation === v ? "border-blue-500 text-blue-600 dark:text-blue-300" : ""
                          }`}
                          onClick={() => form.setValue("oxygenSaturation", v, { shouldValidate: true })}
                        >
                          {v} %
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              <span>
                Aktuelle Werte:{" "}
                {heartRate && <span className="mr-3 text-foreground">❤️ {heartRate} bpm</span>}
                {respiratoryRate && <span className="mr-3 text-foreground">🌬️ {respiratoryRate}/min</span>}
                {oxygenSaturation && <span className="text-foreground">🩸 {oxygenSaturation} %</span>}
                {!heartRate && !respiratoryRate && !oxygenSaturation && (
                  <span>Noch keine Eingabe.</span>
                )}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !userId}
              className="w-full rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-pink-500 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(239,68,68,0.35)] hover:brightness-110"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Speichern..." : "Vitalfunktionen speichern"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
