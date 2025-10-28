"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const healthFormSchema = z.object({
    date: z.string().min(1, "Datum ist erforderlich"),
    // Leere Strings zu undefined umwandeln und dann als Zahl parsen.
    // Dies verbessert die Handhabung optionaler numerischer Felder.
    steps: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int("Muss eine ganze Zahl sein").min(0).optional()),
    heartRate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int("Muss eine ganze Zahl sein").min(0).optional()),
    sleepHours: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).max(24).optional()),
    weight: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).optional()),
    height: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).optional()),
    calories: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).optional()),
    respiratoryRate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int("Muss eine ganze Zahl sein").min(0).optional()),
    bloodPressureSystolic: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int("Muss eine ganze Zahl sein").min(0).optional()),
    bloodPressureDiastolic: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int("Muss eine ganze Zahl sein").min(0).optional()),
    bloodGroup: z.string().optional(),
    bmi: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).optional()),
    bodyTemp: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).optional()),
    oxygenSaturation: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).max(100).optional()),
    stairSteps: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int("Muss eine ganze Zahl sein").min(0).optional()),
    elevation: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).optional()),
    muscleMass: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).max(100).optional()),
    bodyFat: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).max(100).optional()),
    medications: z.string().optional(),
});

type HealthFormValues = z.infer<typeof healthFormSchema>;

interface HealthFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function HealthForm({ userId, onSuccess }: HealthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HealthFormValues>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  async function onSubmit(data: HealthFormValues) {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Fehler beim Speichern der Daten");
      }

      toast.success("Daten erfolgreich gespeichert");
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Fehler beim Speichern der Daten");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Gesundheitsdaten</CardTitle>
        <CardDescription>
          Geben Sie die Gesundheitsdaten für den ausgewählten Nutzer ein.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[90vh]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Felder für Gesundheitsdaten */}
              <FormField
                control={form.control}
                name="steps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schritte</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Herzfrequenz (bpm)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sleepHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schlafstunden</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gewicht (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Größe (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.1"
                        {...field}
                      />
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
                    <FormLabel>Kalorien</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="respiratoryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atemfrequenz</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                  control={form.control}
                  name="bloodPressureSystolic"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Blutdruck (Systolisch)</FormLabel>
                          <FormControl>
                              <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="120" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />

              <FormField
                  control={form.control}
                  name="bloodPressureDiastolic"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Blutdruck (Diastolisch)</FormLabel>
                          <FormControl>
                              <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="80" {...field} />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />

              <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blutgruppe</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bmi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BMI</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyTemp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Körpertemperatur (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oxygenSaturation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sauerstoffsättigung (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stairSteps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treppenstufen</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="elevation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Höhenmeter</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="muscleMass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muskelfettanteil</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bodyFat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fettanteil</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        step="0.1"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medikamente</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Speichern..." : "Speichern"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
