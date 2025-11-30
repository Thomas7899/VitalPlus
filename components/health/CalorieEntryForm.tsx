"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

const MEAL_TYPES = [
  { value: "Frühstück", label: "Frühstück", emoji: "🍳" },
  { value: "Mittagessen", label: "Mittagessen", emoji: "🍽️" },
  { value: "Abendessen", label: "Abendessen", emoji: "🥘" },
  { value: "Snacks", label: "Snacks/Sonstiges", emoji: "🍎" },
];

const PORTION_PRESETS = [
  { label: "Leicht", kcal: 250 },
  { label: "Normal", kcal: 500 },
  { label: "Groß", kcal: 800 },
];

const calorieFormSchema = z.object({
  meal: z.enum(["Frühstück", "Mittagessen", "Abendessen", "Snacks"]),
  food: z.string().optional(),
  calories: z.coerce.number().min(1, "Kalorien müssen größer als 0 sein."),
  date: z.string().min(1, "Datum ist erforderlich."),
  time: z.string().min(1, "Zeit ist erforderlich."),
  notes: z.string().optional(),
});

type CalorieFormValues = z.infer<typeof calorieFormSchema>;

interface CalorieEntryFormProps {
  userId: string | undefined;
  onEntrySaved: () => void;
}

export function CalorieEntryForm({ userId, onEntrySaved }: CalorieEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const now = new Date();
  const form = useForm<CalorieFormValues>({
    resolver: zodResolver(calorieFormSchema),
    defaultValues: {
      meal: "Frühstück",
      food: "",
      calories: 500,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
      notes: "",
    },
  });

  async function onSubmit(data: CalorieFormValues) {
    setIsSubmitting(true);
    if (!userId) {
      toast.error("Nicht angemeldet.");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: `${data.date}T${data.time}:00`,
          calories: data.calories,
          mealType: data.meal,
          notes:
            (data.food || "").trim() +
            (data.notes ? `::${data.notes}` : ""),
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern der Mahlzeit.");

      toast.success("Mahlzeit gespeichert ✅");
      onEntrySaved();

      form.reset({
        meal: data.meal,
        date: data.date,
        time: new Date().toTimeString().slice(0, 5),
        food: "",
        calories: data.calories, // letzte Portion merken
        notes: "",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const calories = form.watch("calories");

  return (
    <Card className="mb-6 border-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/90 shadow-xl shadow-purple-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-50">
          Mahlzeit schnell eintragen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Basis: Mahlzeit + Portion */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="meal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-300">
                      Mahlzeit
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50">
                          <SelectValue placeholder="Mahlzeit wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEAL_TYPES.map((meal) => (
                          <SelectItem key={meal.value} value={meal.value}>
                            {meal.emoji} {meal.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-300">
                        Portion (kcal)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  {PORTION_PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`rounded-full border-slate-700 bg-slate-900/70 text-xs text-slate-200 hover:border-purple-400 ${
                        calories === p.kcal ? "border-purple-500 text-purple-300" : ""
                      }`}
                      onClick={() => form.setValue("calories", p.kcal)}
                    >
                      {p.label} · {p.kcal} kcal
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Umschalter für Details */}
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-xs text-slate-400 underline-offset-2 hover:underline"
            >
              {showDetails
                ? "Details ausblenden"
                : "Details einblenden (Lebensmittel, Datum, Notiz)"}
            </button>

            {showDetails && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="food"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel className="text-xs text-slate-300">
                        Lebensmittel (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Hähnchen mit Reis"
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
                        Zeit
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
                    <FormItem className="lg:col-span-2">
                      <FormLabel className="text-xs text-slate-300">
                        Notizen (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. große Portion, Auswärts essen..."
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

            <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
              <span>
                {calories.toLocaleString("de-DE")} kcal{" "}
                <span className="text-slate-400">für diese Mahlzeit</span>
              </span>
            </div>

            <Button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-sm font-semibold shadow-[0_10px_40px_rgba(59,130,246,0.45)] hover:brightness-110"
              disabled={isSubmitting || !userId}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Speichern..." : "Mahlzeit speichern"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}