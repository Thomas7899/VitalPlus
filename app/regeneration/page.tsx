"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";

import { HealthDataTable } from "@/components/health/HealthDataTable";
import { StatCardWithChart } from "@/components/dashboard/StatCardWithChart";
import { metrics } from "@/components/utils/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const REGENERATION_METRICS = metrics.filter(m => m.category === "Regeneration");

const HealthChart = dynamic(() => import('@/components/health/HealthChart').then(mod => mod.HealthChart), {
  ssr: false,
  loading: () => <div className="h-80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

const formSchema = z.object({
  sleepHours: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()),
});

type FormValues = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RegenerationPage() {
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
        .filter((d: any) => REGENERATION_METRICS.some(m => d[m.key] != null))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [healthData]
  );

  async function onSubmit(data: FormValues) {
    if (!userId) return toast.error("Kein Nutzer ausgewählt.");
    if (!data.sleepHours) {
      return toast.error("Bitte geben Sie einen Wert ein.");
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
      <h1 className="text-3xl font-bold">Regeneration</h1>

      <Card>
        <CardHeader>
          <CardTitle>Schlaf erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
              <FormField
                control={form.control}
                name="sleepHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schlafdauer (Stunden)</FormLabel>
                    <FormControl><Input type="text" inputMode="decimal" placeholder="z.B. 7.5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /><p className="ml-2">Lade Daten...</p></div>}

      {!isLoading && (
        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Diagramm</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <div className="grid gap-6 grid-cols-1">
              {REGENERATION_METRICS.map((metric) => (
                <StatCardWithChart key={metric.key} data={healthData} metric={metric} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <Card>
              <CardHeader><CardTitle>Alle Messwerte</CardTitle></CardHeader>
              <CardContent>
                <HealthDataTable data={filteredData} metrics={REGENERATION_METRICS} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}