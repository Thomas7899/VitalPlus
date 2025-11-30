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
import { useSession } from "next-auth/react";
import Link from "next/link";

const REGENERATION_METRICS = metrics.filter(
  (m) => m.category === "Regeneration"
);

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

const formSchema = z.object({
  sleepHours: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z
      .coerce.number({ invalid_type_error: "Muss eine Zahl sein" })
      .min(0.5)
      .max(16)
      .optional()
  ),
});

type FormValues = z.infer<typeof formSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RegenerationPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: healthData = [], isLoading, error } = useSWR(
    userId ? `/api/health?userId=${userId}` : null,
    fetcher
  );

  const lastEntry = useMemo(
    () =>
      healthData
        ?.filter((d: any) => d.sleepHours != null)
        ?.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0],
    [healthData]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sleepHours: lastEntry?.sleepHours ?? 7.5,
    },
  });

  const filteredData = useMemo(
    () =>
      healthData
        .filter((d: any) =>
          REGENERATION_METRICS.some((m) => d[m.key] != null)
        )
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [healthData]
  );

  async function onSubmit(data: FormValues) {
    if (!userId) {
      toast.error("Bitte melde dich an, um Daten zu speichern.");
      return;
    }
    if (!data.sleepHours) {
      return toast.error("Bitte gib einen Wert ein.");
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: new Date().toISOString(),
          sleepHours: data.sleepHours,
        }),
      });
      if (!response.ok) throw new Error("Fehler beim Speichern.");
      toast.success("Schlafdauer gespeichert ✅");
      mutate(`/api/health?userId=${userId}`);
      form.reset({ sleepHours: data.sleepHours });
    } catch (error) {
      toast.error("Speichern fehlgeschlagen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentSleep = form.watch("sleepHours");

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-slate-50">Regeneration</h1>

      <Card className="border-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/90 shadow-xl shadow-purple-500/10">
        <CardHeader>
          <CardTitle className="text-lg text-slate-50">
            Schlaf erfassen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 max-w-md"
            >
              <FormField
                control={form.control}
                name="sleepHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-300">
                      Schlafdauer (Stunden)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        inputMode="decimal"
                        placeholder="z.B. 7.5"
                        className="rounded-2xl bg-slate-900/70 border-slate-700 text-slate-50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[6, 7.5, 8.5].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant="outline"
                          className={`rounded-full border-slate-700 bg-slate-900/70 text-xs text-slate-200 hover:border-purple-400 ${
                            currentSleep === v
                              ? "border-purple-500 text-purple-300"
                              : ""
                          }`}
                          onClick={() =>
                            form.setValue("sleepHours", v, {
                              shouldValidate: true,
                            })
                          }
                        >
                          {v.toString().replace(".", ",")} h
                        </Button>
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                <span>
                  Aktuelle Eingabe:{" "}
                  {currentSleep ? (
                    <span className="font-semibold">
                      {currentSleep.toString().replace(".", ",")} h Schlaf
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Noch keine Eingabe.
                    </span>
                  )}
                  {lastEntry && (
                    <span className="ml-2 text-xs text-slate-400">
                      (letzte Messung: {lastEntry.sleepHours} h)
                    </span>
                  )}
                </span>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !userId}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-sm font-semibold shadow-[0_10px_40px_rgba(59,130,246,0.45)] hover:brightness-110"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Speichern..." : "Schlaf speichern"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-2 text-slate-300">Lade Daten...</p>
        </div>
      )}

      {!isLoading && error && (
        <Card>
          <CardContent className="text-center py-8 text-red-500">
            Fehler beim Laden der Daten.
          </CardContent>
        </Card>
      )}

      {!isLoading && userId && filteredData.length > 0 && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList>
            <TabsTrigger value="chart">Diagramm</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <div className="grid gap-6 grid-cols-1">
              {REGENERATION_METRICS.map((metric) => (
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
                  metrics={REGENERATION_METRICS}
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
              Noch keine Regenerationsdaten vorhanden. Erfasse deinen
              Schlaf, um deinen Fortschritt zu sehen.
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
                Bitte melde dich an
              </h3>
              <p className="text-muted-foreground">
                Um deine Regenerationsdaten zu sehen und zu verwalten,
                musst du angemeldet sein.
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