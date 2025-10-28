"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { StatCardWithChart } from "@/components/StatCardWithChart";
import { HealthDataTable } from "@/components/HealthDataTable";
import { metrics } from "@/components/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COMPOSITION_METRICS = metrics.filter(m => ["weight", "bmi", "muscleMass", "bodyFat"].includes(m.key));

const formSchema = z.object({
  weight: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()),
  bmi: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()),
  muscleMass: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()),
  bodyFat: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()),
});

const HealthChart = dynamic(() => import('@/components/HealthChart').then(mod => mod.HealthChart), {
  ssr: false,
  loading: () => <div className="h-80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

type FormValues = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function KoerperzusammensetzungPage() {
  const userId = "2fbb9c24-cdf8-49db-9b74-0762017445a1"; // Feste User-ID
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: healthData = [], isLoading } = useSWR(
    `/api/health?userId=${userId}`,
    fetcher
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const filteredData = useMemo(
    () =>
      healthData
        .filter((d: any) => COMPOSITION_METRICS.some(m => d[m.key] != null))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [healthData]
  );

  async function onSubmit(data: FormValues) {
    if (!userId) return toast.error("Kein Nutzer ausgewählt.");
    if (Object.values(data).every(v => v === undefined)) {
      return toast.error("Bitte geben Sie mindestens einen Wert ein.");
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userId, date: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Fehler beim Speichern.");
      toast.success("Daten gespeichert!");
      mutate(`/api/health?userId=${userId}`);
      form.reset();
    } catch (error) {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Körperzusammensetzung</h1>

      <Card>
        <CardHeader>
          <CardTitle>Neue Messung erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gewicht (kg)</FormLabel>
                      <FormControl><Input type="text" inputMode="decimal" placeholder="z.B. 75.5" {...field} /></FormControl>
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
                      <FormControl><Input type="text" inputMode="decimal" placeholder="z.B. 22.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="muscleMass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Muskelmasse (%)</FormLabel>
                      <FormControl><Input type="text" inputMode="decimal" placeholder="z.B. 45.2" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bodyFat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Körperfettanteil (%)</FormLabel>
                      <FormControl><Input type="text" inputMode="decimal" placeholder="z.B. 18.5" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-2">Lade Diagramme...</p>
        </div>
      )}

      {!isLoading && (
        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Diagramme</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {COMPOSITION_METRICS.map((metric) => (
                <StatCardWithChart key={metric.key} data={healthData} metric={metric} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <Card>
              <CardHeader><CardTitle>Alle Messwerte</CardTitle></CardHeader>
              <CardContent>
                <HealthDataTable data={filteredData} metrics={COMPOSITION_METRICS} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}