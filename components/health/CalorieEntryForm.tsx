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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const MEAL_TYPES = [
  { value: "Frühstück", label: "Frühstück", emoji: "🍳" },
  { value: "Mittagessen", label: "Mittagessen", emoji: "🍽️" },
  { value: "Abendessen", label: "Abendessen", emoji: "🥘" },
  { value: "Snacks", label: "Snacks/Sonstiges", emoji: "🍎" },
];

const calorieFormSchema = z.object({
  meal: z.enum(["Frühstück", "Mittagessen", "Abendessen", "Snacks"]),
  food: z.string().min(1, "Lebensmittel ist erforderlich."),
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

  const form = useForm<CalorieFormValues>({
    resolver: zodResolver(calorieFormSchema),
    defaultValues: {
      meal: "Frühstück",
      food: "",
      calories: 0,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
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
          notes: `${data.food}${data.notes ? `::${data.notes}` : ''}`,
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern der Mahlzeit.");

      toast.success("Mahlzeit erfolgreich gespeichert!");
      onEntrySaved();

      form.reset({
        meal: data.meal,
        date: data.date,
        time: data.time,
        food: "",
        calories: 0,
        notes: "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Neue Mahlzeit erfassen</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="meal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mahlzeit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
              <FormField
                control={form.control}
                name="food"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lebensmittel</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Apfel, Joghurt..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kalorien (kcal)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Datum</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Zeit</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notizen (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Portion, Zubereitung..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={isSubmitting || !userId}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Eintrag speichern
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}