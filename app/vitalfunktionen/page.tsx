"use client";

import { useState, useMemo, useCallback } from "react";
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
import { Loader2, LogIn } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

const VITAL_METRICS = metrics.filter((m) =>
  ["heartRate", "respiratoryRate", "oxygenSaturation"].includes(m.key)
);

const formSchema = z.object({
  heartRate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "Muss eine Zahl sein" })
      .int()
      .min(20)
      .max(250)
      .optional()
  ),
  respiratoryRate: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "Muss eine Zahl sein" })
      .int()
      .min(5)
      .max(60)
      .optional()
  ),
  oxygenSaturation: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "Muss eine Zahl sein" })
      .min(50)
      .max(100)
      .optional()
  ),
});

type FormValues = z.infer<typeof formSchema>;

const HealthChart = dynamic(
  () =>
    import("@/components/health/HealthChart").then(
      (mod) => mod.HealthChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-80 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    ),
  }
);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VitalfunktionenPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: healthData = [], error, isLoading } = useSWR(
    userId ? `/api/health?userId=${userId}` : null,
    fetcher
  );

  const lastEntry = useMemo(
    () =>
      healthData
        ?.filter(
          (d: any) =>
            d.heartRate != null ||
            d.respiratoryRate != null ||
            d.oxygenSaturation != null
        )
        ?.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0],
    [healthData]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heartRate: lastEntry?.heartRate ?? 60,
      respiratoryRate: lastEntry?.respiratoryRate ?? 16,
      oxygenSaturation: lastEntry?.oxygenSaturation ?? 98,
    },
  });

  const filteredData = useMemo(
    () =>
      healthData
        .filter((d: any) =>
          VITAL_METRICS.some((m) => d[m.key] != null)
        )
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [healthData]
  );

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
        form.reset({
          heartRate: data.heartRate,
          respiratoryRate: data.respiratoryRate,
          oxygenSaturation: data.oxygenSaturation,
        });
      } catch (error) {
        toast.error("Speichern fehlgeschlagen.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, form]
  );

  const heartRate = form.watch("heartRate");
  const respiratoryRate = form.watch("respiratoryRate");
  const oxygenSaturation = form.watch("oxygenSaturation");

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Vitalfunktionen</h1>

      <Card className="border border-border/50 bg-card/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/90 shadow-xl shadow-red-500/5 dark:shadow-purple-500/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Neue Messung erfassen
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
                            onClick={() =>
                              form.setValue("heartRate", v, { shouldValidate: true })
                            }
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
                            onClick={() =>
                              form.setValue("respiratoryRate", v, { shouldValidate: true })
                            }
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
                            onClick={() =>
                              form.setValue("oxygenSaturation", v, { shouldValidate: true })
                            }
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
                {isSubmitting ? "Speichern..." : "Messung speichern"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="text-center py-8 flex justify-center items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Lade Vitalfunktionen...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && error && (
        <Card>
          <CardContent className="text-center py-8 text-red-600">
            Fehler beim Laden der Daten.
          </CardContent>
        </Card>
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
                  <CardTitle className="text-lg font-semibold text-white">
                    Vitalfunktionen im Verlauf
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 md:p-6">
                  <HealthChart data={healthData} metrics={VITAL_METRICS} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Alle Messwerte</CardTitle>
              </CardHeader>
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
            <p className="text-muted-foreground">
              Noch keine Vitaldaten vorhanden. Erfasse deine erste Messung!
            </p>
          </CardContent>
        </Card>
      )}

      {status === "unauthenticated" && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <LogIn className="h-12 w-12 text-slate-400" />
              <h3 className="text-xl font-semibold">Bitte melde dich an</h3>
              <p className="text-muted-foreground">
                Um deine Vitalfunktionen zu sehen und zu verwalten, musst du angemeldet sein.
              </p>
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