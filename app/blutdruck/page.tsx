"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR, { mutate } from "swr";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BloodPressureChart } from "@/components/health/BloodPressureChart";
import { BloodPressureTable } from "@/components/health/BloodPressureTable";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";

const PRESET_VALUES = {
  systolic: [90, 100, 110, 120, 130, 140, 150, 160, 170, 180],
  diastolic: [60, 65, 70, 75, 80, 85, 90, 95, 100, 110]
};

const bloodPressureFormSchema = z.object({
  systolic: z.coerce.number().min(1, "Erforderlich"),
  diastolic: z.coerce.number().min(1, "Erforderlich"),
  pulse: z.number().optional(),
  date: z.string().min(1, "Datum ist erforderlich."),
  time: z.string().min(1, "Zeit ist erforderlich."),
  notes: z.string().optional(),
});

type BloodPressureFormValues = z.infer<typeof bloodPressureFormSchema>;

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

export default function BloodPressurePage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: readings = [], error, isLoading } = useSWR(
    userId ? `/api/health?userId=${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false, 
    }
  );

  const form = useForm<BloodPressureFormValues>({
    resolver: zodResolver(bloodPressureFormSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 70,
      pulse: 70,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: "",
    },
  });


  async function onSubmit(data: BloodPressureFormValues) {
    if (!userId) {
      toast.error("Bitte melden Sie sich an, um Daten zu speichern.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          date: `${data.date}T${data.time}:00`,
          bloodPressureSystolic: data.systolic,
          bloodPressureDiastolic: data.diastolic,
          heartRate: data.pulse, 
          notes: data.notes,
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern der Messung.");

      toast.success("Messung erfolgreich gespeichert!");
      mutate(`/api/health?userId=${userId}`);
      form.reset({
        ...form.getValues(),
        time: new Date().toTimeString().slice(0, 5),
        notes: "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const deleteReading = async (id: string) => {
    toast.info("Löschfunktion noch nicht implementiert.");
  }

  const getBloodPressureCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { category: "Normal", color: "text-green-600" };
    if (systolic < 130 && diastolic < 80) return { category: "Erhöht", color: "text-yellow-600" };
    if (systolic < 140 && diastolic < 90) return { category: "Bluthochdruck Stufe 1", color: "text-orange-600" };
    if (systolic < 180 && diastolic < 120) return { category: "Bluthochdruck Stufe 2", color: "text-red-600" };
    return { category: "Hypertensive Krise", color: "text-red-800" };
  };

  const watchedSystolic = form.watch("systolic");
  const watchedDiastolic = form.watch("diastolic");

  const currentCategory = useMemo(
    () => getBloodPressureCategory(watchedSystolic, watchedDiastolic),
    [watchedSystolic, watchedDiastolic]
  );

  const filteredReadings = useMemo(() => 
    readings
      .filter((r: any) => r.bloodPressureSystolic != null)
      .map((r: any) => ({ 
        id: r.id,
        systolic: r.bloodPressureSystolic,
        diastolic: r.bloodPressureDiastolic,
        pulse: r.heartRate,
        notes: r.notes,
        time: new Date(r.date).toTimeString().slice(0,5), 
        date: new Date(r.date).toISOString().split('T')[0]
      }))
      .sort((a: any, b: any) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
    , [readings]
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Blutdruck Monitor</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Neue Messung erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="systolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Systolisch (mmHg)</FormLabel> 
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRESET_VALUES.systolic.map(value => (
                            <SelectItem key={value} value={value.toString()}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="diastolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolisch (mmHg)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRESET_VALUES.diastolic.map(value => (
                            <SelectItem key={value} value={value.toString()}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pulse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puls (optional)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} />
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
                        <Input placeholder="z.B. nach dem Sport, morgens..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={isSubmitting || !userId}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? "Speichern..." : "Messung speichern"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>

          {/* Aktuelle Bewertung */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {watchedSystolic}/{watchedDiastolic} mmHg
              </span>
              <span className={`font-medium ${currentCategory.color}`}>{currentCategory.category}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {(status === "loading" || isLoading) && (
        <Card>
          <CardContent className="text-center py-8 flex justify-center items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Lade Messungen...</p>
          </CardContent>
        </Card>
      )}

      {status === "unauthenticated" && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <LogIn className="h-12 w-12 text-slate-400" />
              <h3 className="text-xl font-semibold">Bitte melden Sie sich an</h3>
              <p className="text-muted-foreground">Um Ihre Blutdruckdaten zu sehen und zu verwalten, müssen Sie angemeldet sein.</p>
              <Button asChild>
                <Link href="/login">Zum Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "authenticated" && !isLoading && (
        <>
          {error && (
            <Card><CardContent className="text-center py-8 text-red-600">Fehler beim Laden der Daten.</CardContent></Card>
          )}
          {!error && filteredReadings.length > 0 && (
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chart">Diagramm</TabsTrigger>
                <TabsTrigger value="table">Tabelle</TabsTrigger>
              </TabsList>

              <TabsContent value="chart">
                <Card>
                  <CardHeader><CardTitle>Blutdruckverlauf</CardTitle></CardHeader>
                  <CardContent><BloodPressureChart data={filteredReadings} /></CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="table">
                <Card>
                  <CardHeader><CardTitle>Messwerte ({filteredReadings.length} Einträge)</CardTitle></CardHeader>
                  <CardContent><BloodPressureTable data={filteredReadings} onDelete={deleteReading} /></CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          {!error && filteredReadings.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Noch keine Messungen vorhanden. Erfassen Sie Ihre erste Messung!
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}