"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { StatCardWithChart } from "@/components/dashboard/StatCardWithChart";
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

const COMPOSITION_METRICS = metrics.filter((m) =>
  ["weight", "bmi", "muscleMass", "bodyFat"].includes(m.key)
);

const formSchema = z.object({
  weight: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()
  ),
  bmi: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()
  ),
  muscleMass: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()
  ),
  bodyFat: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Muss eine Zahl sein" }).optional()
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

export default function KoerperzusammensetzungPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { data: healthData = [], error, isLoading } = useSWR(
    userId ? `/api/health?userId=${userId}` : null,
    fetcher
  );

  const lastEntry = useMemo(
    () =>
      healthData
        ?.filter((d: any) => d.weight != null)
        ?.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0],
    [healthData]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weight: lastEntry?.weight ?? 75,
      bmi: lastEntry?.bmi ?? undefined,
      muscleMass: lastEntry?.muscleMass ?? undefined,
      bodyFat: lastEntry?.bodyFat ?? undefined,
    },
  });

  const filteredData = useMemo(
    () =>
      healthData
        .filter((d: any) =>
          COMPOSITION_METRICS.some((m) => d[m.key] != null)
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
        toast.error("Bitte melden Sie sich an, um Daten zu speichern.");
        return;
      }

      if (Object.values(data).every((v) => v === undefined)) {
        return toast.error("Bitte geben Sie mindestens einen Wert ein.");
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
        toast.success("Daten gespeichert!");
        mutate(`/api/health?userId=${userId}`);
        form.reset({
          weight: data.weight,
          bmi: data.bmi,
          muscleMass: data.muscleMass,
          bodyFat: data.bodyFat,
        });
      } catch (error) {
        toast.error("Speichern fehlgeschlagen.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, form]
  );

  const currentWeight = form.watch("weight");

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">
        Körperzusammensetzung
      </h1>

      <Card className="border border-border/50 bg-card/80 dark:bg-gradient-to-br dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/90 shadow-xl shadow-blue-500/5 dark:shadow-purple-500/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Neue Messung erfassen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Gewicht (kg)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          placeholder="z.B. 75.5"
                          className="rounded-2xl bg-secondary/50 border-border text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-wrap items-end gap-2">
                  <span className="text-xs text-muted-foreground mr-2">
                    Schnelle Anpassung:
                  </span>
                  {[-1, -0.5, 0.5, 1].map((delta) => (
                    <Button
                      key={delta}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-blue-400"
                      onClick={() =>
                        form.setValue(
                          "weight",
                          Number(
                            (Number(currentWeight || 0) + delta).toFixed(1)
                          )
                        )
                      }
                    >
                      {delta > 0 ? `+${delta}` : delta} kg
                    </Button>
                  ))}
                  {lastEntry && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-border bg-secondary/50 text-xs text-foreground hover:border-blue-400"
                      onClick={() =>
                        form.setValue("weight", lastEntry.weight)
                      }
                    >
                      wie letzte Messung
                    </Button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              >
                {showDetails
                  ? "Details ausblenden"
                  : "Weitere Werte erfassen (BMI, Muskelmasse, Körperfett)"}
              </button>

              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bmi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          BMI
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="z.B. 22.1"
                            className="rounded-2xl bg-secondary/50 border-border text-foreground"
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
                        <FormLabel className="text-xs text-muted-foreground">
                          Muskelmasse (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="z.B. 45.2"
                            className="rounded-2xl bg-secondary/50 border-border text-foreground"
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
                        <FormLabel className="text-xs text-muted-foreground">
                          Körperfettanteil (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="z.B. 18.5"
                            className="rounded-2xl bg-secondary/50 border-border text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-foreground">
                <span>
                  Aktuelles Gewicht:{" "}
                  <span className="font-semibold">
                    {currentWeight?.toString().replace(".", ",")} kg
                  </span>
                  {lastEntry && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (letzte Messung: {lastEntry.weight} kg)
                    </span>
                  )}
                </span>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !userId}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-sm font-semibold text-white shadow-[0_10px_40px_rgba(59,130,246,0.35)] hover:brightness-110"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
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
            <p>Lade Körperdaten...</p>
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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {COMPOSITION_METRICS.map((metric) => (
                <StatCardWithChart
                  key={metric.key}
                  data={healthData}
                  metric={metric}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Alle Messwerte</CardTitle>
              </CardHeader>
              <CardContent>
                <HealthDataTable
                  data={filteredData}
                  metrics={COMPOSITION_METRICS}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!isLoading && userId && filteredData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Noch keine Körperdaten vorhanden. Erfassen Sie Ihre erste
              Messung!
            </p>
          </CardContent>
        </Card>
      )}

      {status === "unauthenticated" && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <LogIn className="h-12 w-12 text-slate-400" />
              <h3 className="text-xl font-semibold">
                Bitte melden Sie sich an
              </h3>
              <p className="text-muted-foreground">
                Um Ihre Körperdaten zu sehen und zu verwalten, müssen Sie
                angemeldet sein.
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