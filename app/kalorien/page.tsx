"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalorieChart } from "@/components/health/CalorieChart";
import { CalorieTable } from "@/components/health/CalorieTable";
import { cn } from "@/lib/utils";

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

// Helper-Funktion für SWR zum Fetchen von Daten
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function KalorienPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: healthData = [], error, isLoading } = useSWR(
    // Daten erst abrufen, wenn die userId verfügbar ist
    userId ? `/api/health?userId=${userId}` : null,
    fetcher
  );

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
      toast.error("Bitte melden Sie sich an, um Daten zu speichern.");
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
          notes: `${data.food}${data.notes ? ` - ${data.notes}` : ''}`,
        }),
      });

      if (!response.ok) throw new Error("Fehler beim Speichern der Mahlzeit.");

      toast.success("Mahlzeit erfolgreich gespeichert!");
      if (userId) mutate(`/api/health?userId=${userId}`);
      form.reset({
        ...form.getValues(),
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

  const calorieData = useMemo(() =>
    healthData
      .filter((d: any) => d.calories != null)
      .map((d: any) => ({
        id: d.id,
        date: new Date(d.date).toISOString().split('T')[0],
        time: new Date(d.date).toTimeString().slice(0, 5),
        meal: d.mealType || 'Snacks',
        food: d.notes?.split(' - ')[0] || 'Unbekannt',
        calories: d.calories,
      }))
      .sort((a: any, b: any) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()),
    [healthData]
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Kalorien Tracker</h1>

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

      {isLoading && (
        <Card><CardContent className="text-center py-8 flex justify-center items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> <p>Lade Kaloriendaten...</p></CardContent></Card>
      )}
      {!isLoading && error && (
        <Card><CardContent className="text-center py-8 text-red-600">Fehler beim Laden der Daten.</CardContent></Card>
      )}

      {!isLoading && userId && calorieData.length > 0 && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Diagramm</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>
          <TabsContent value="chart">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-2 md:p-6">
                <CalorieChart data={calorieData} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Alle Einträge ({calorieData.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CalorieTable data={calorieData} onDelete={() => toast.info("Löschen noch nicht implementiert.")} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!isLoading && userId && calorieData.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Noch keine Kaloriendaten vorhanden. Erfassen Sie Ihre erste Mahlzeit!</p>
          </CardContent>
        </Card>
      )}

      {status === "unauthenticated" && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <LogIn className="h-12 w-12 text-slate-400" />
              <h3 className="text-xl font-semibold">Bitte melden Sie sich an</h3>
              <p className="text-muted-foreground">Um Ihre Kaloriendaten zu sehen und zu verwalten, müssen Sie angemeldet sein.</p>
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