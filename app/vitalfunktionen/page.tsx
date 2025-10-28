"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";

import { HealthDataTable } from "@/components/HealthDataTable";
import { metrics } from "@/components/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const VITAL_METRICS = metrics.filter(m => ["heartRate", "respiratoryRate", "oxygenSaturation"].includes(m.key));

const formSchema = z.object({
  heartRate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int().optional()),
  respiratoryRate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int().optional()),
  oxygenSaturation: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).max(100).optional()),
});

const HealthChart = dynamic(() => import('@/components/HealthChart').then(mod => mod.HealthChart), {
  ssr: false,
  loading: () => <div className="h-80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

type FormValues = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VitalfunktionenPage() {
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
        .filter((d: any) => VITAL_METRICS.some(m => d[m.key] != null))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [healthData]
  );

  async function onSubmit(data: FormValues) {
    if (!userId) return toast.error("Kein Nutzer ausgewählt.");
    if (!data.heartRate && !data.respiratoryRate && !data.oxygenSaturation) {
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
      <h1 className="text-3xl font-bold">Vitalfunktionen</h1>

      <Card>
        <CardHeader>
          <CardTitle>Neue Messung erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="heartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Herzfrequenz (bpm)</FormLabel>
                      <FormControl><Input type="text" inputMode="numeric" placeholder="z.B. 60" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="respiratoryRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atemfrequenz (pro Min.)</FormLabel>
                      <FormControl><Input type="text" inputMode="numeric" placeholder="z.B. 16" {...field} /></FormControl>
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
                      <FormControl><Input type="text" inputMode="numeric" placeholder="z.B. 98" {...field} /></FormControl>
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Diagramme</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <div className="grid gap-6 grid-cols-1">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white">Vitalfunktionen im Verlauf</CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  <HealthChart data={healthData} metrics={VITAL_METRICS} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="table">
            <Card>
              <CardHeader><CardTitle>Alle Messwerte</CardTitle></CardHeader>
              <CardContent>
                <HealthDataTable data={filteredData} metrics={VITAL_METRICS} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
