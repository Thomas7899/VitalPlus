
// VitalPlus/components/health/BloodPressureForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PRESET_VALUES = {
  systolic: [100, 110, 120, 130, 140, 150, 160],
  diastolic: [60, 70, 80, 90, 100],
};

const bloodPressureFormSchema = z.object({
  systolic: z.coerce.number().min(1, "Erforderlich"),
  diastolic: z.coerce.number().min(1, "Erforderlich"),
  pulse: z.number().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().optional(),
});

type BloodPressureFormValues = z.infer<typeof bloodPressureFormSchema>;

const swrKey = (userId: string) => `/api/health?userId=${userId}`;

export function BloodPressureForm({ userId }: { userId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const now = new Date();
  const form = useForm<BloodPressureFormValues>({
    resolver: zodResolver(bloodPressureFormSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 80,
      pulse: undefined,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
      notes: "",
    },
  });

  const watchedSystolic = form.watch("systolic");
  const watchedDiastolic = form.watch("diastolic");

  const currentCategory = useMemo(() => {
    if (watchedSystolic < 120 && watchedDiastolic < 80)
      return { category: "Normal", color: "text-emerald-500" };
    if (watchedSystolic < 130 && watchedDiastolic < 80)
      return { category: "Erhöht", color: "text-yellow-400" };
    if (watchedSystolic < 140 && watchedDiastolic < 90)
      return { category: "Bluthochdruck Stufe 1", color: "text-orange-400" };
    if (watchedSystolic < 180 && watchedDiastolic < 120)
      return { category: "Bluthochdruck Stufe 2", color: "text-red-500" };
    return { category: "Hypertensive Krise", color: "text-red-600" };
  }, [watchedSystolic, watchedDiastolic]);

  async function onSubmit(data: BloodPressureFormValues) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: `${data.date}T${data.time}:00`,
          bloodPressureSystolic: data.systolic,
          bloodPressureDiastolic: data.diastolic,
          heartRate: data.pulse,
          notes: data.notes,
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern der Messung.");

      toast.success("Blutdruck gespeichert ✅");
      mutate(swrKey(userId));
      const t = new Date().toTimeString().slice(0, 5);
      form.reset({ ...form.getValues(), time: t, notes: "" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-6 border-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/90 shadow-xl shadow-purple-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-50">
          Blutdruck schnell erfassen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-300">
                      Systolisch
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50">
                          <SelectValue placeholder="SYS" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRESET_VALUES.systolic.map((v) => (
                          <SelectItem key={v} value={v.toString()}>
                            {v} mmHg
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-300">
                      Diastolisch
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50">
                          <SelectValue placeholder="DIA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRESET_VALUES.diastolic.map((v) => (
                          <SelectItem key={v} value={v.toString()}>
                            {v} mmHg
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pulse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-300">
                      Puls (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="72"
                        className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs text-slate-400 underline-offset-2 hover:underline"
            >
              {showAdvanced ? "Details ausblenden" : "Details einblenden (Datum, Notiz)"}
            </button>

            {showAdvanced && (
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-300">
                        Datum
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-300">
                        Uhrzeit
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-xs text-slate-300">
                        Notiz
                      </FormLabel>
                      <FormControl>
                        <Input
                          maxLength={80}
                          placeholder="z.B. nach dem Sport"
                          className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3">
              <span className="text-sm font-semibold text-slate-100">
                {watchedSystolic}/{watchedDiastolic} mmHg
              </span>
              <span className={`text-xs font-medium ${currentCategory.color}`}>
                {currentCategory.category}
              </span>
            </div>

            <Button
              type="submit"
              className="mt-1 w-full rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-sm font-semibold shadow-[0_10px_40px_rgba(59,130,246,0.45)] hover:brightness-110"
              disabled={isSubmitting || !userId}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Speichern..." : "Blutdruck speichern"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}