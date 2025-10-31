"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { HealthDataTable } from "@/components/health/HealthDataTable";
import { metrics } from "@/components/utils/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const VITAL_METRICS = metrics.filter(m => ["heartRate", "respiratoryRate", "oxygenSaturation"].includes(m.key));

const formSchema = z.object({
  heartRate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int().optional()),
  respiratoryRate: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).int().optional()),
  oxygenSaturation: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).min(0).max(100).optional()),
});

const HealthChart = dynamic(() => import('@/components/health/HealthChart').then(mod => mod.HealthChart), {
  ssr: false,
  loading: () => <div className="h-80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

type FormValues = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VitalfunktionenPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: healthData = [], error, isLoading } = useSWR(
    userId ? `/api/health?userId=${userId}` : null,
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
    if (!userId) {
      toast.error("Bitte melden Sie sich an, um Daten zu speichern.");
      return;
    }

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
      if (userId) mutate(`/api/health?userId=${userId}`);
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
              <Button type="submit" disabled={isSubmitting || !userId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card><CardContent className="text-center py-8 flex justify-center items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> <p>Lade Vitalfunktionen...</p></CardContent></Card>
      )}

      {!isLoading && error && (
        <Card><CardContent className="text-center py-8 text-red-600">Fehler beim Laden der Daten.</CardContent></Card>
      )}

      {!isLoading && userId && filteredData.length > 0 && (
        <Tabs defaultValue="chart" className="w-full">
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

      {!isLoading && userId && filteredData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Noch keine Vitaldaten vorhanden. Erfassen Sie Ihre erste Messung!</p>
          </CardContent>
        </Card>
      )}

      {status === "unauthenticated" && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <LogIn className="h-12 w-12 text-slate-400" />
              <h3 className="text-xl font-semibold">Bitte melden Sie sich an</h3>
              <p className="text-muted-foreground">Um Ihre Vitalfunktionen zu sehen und zu verwalten, müssen Sie angemeldet sein.</p>
              <Button asChild>
                <Link href="/login">Zum Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
