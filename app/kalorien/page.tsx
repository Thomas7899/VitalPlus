"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalorieChart } from "@/components/CalorieChart";
import { CalorieTable } from "@/components/CalorieTable";
import { useCalorieEntries } from "@/hooks/useCalorieEntries";
import { cn } from "@/lib/utils";

const MEAL_TYPES = [
  { value: "Frühstück", label: "Frühstück", emoji: "🍳" },
  { value: "Mittagessen", label: "Mittagessen", emoji: "🍽️" },
  { value: "Abendessen", label: "Abendessen", emoji: "🥘" },
  { value: "Snacks", label: "Snacks/Sonstiges", emoji: "🍎" },
];

const COMMON_FOODS = [
  { name: "Apfel", calories: 80 },
  { name: "Banane", calories: 105 },
  { name: "Brot (1 Scheibe)", calories: 70 },
  { name: "Butter (10g)", calories: 75 },
  { name: "Haferflocken (50g)", calories: 185 },
  { name: "Joghurt (150g)", calories: 85 },
  { name: "Milch (200ml)", calories: 120 },
  { name: "Müsli (50g)", calories: 200 },
  { name: "Nudeln (100g)", calories: 350 },
  { name: "Reis (100g)", calories: 350 },
];

const calorieFormSchema = z.object({
  meal: z.enum(["Frühstück", "Mittagessen", "Abendessen", "Snacks"]),
  food: z.string().min(1, "Lebensmittel ist erforderlich."),
  calories: z.number().min(1, "Kalorien müssen größer als 0 sein."),
  date: z.string().min(1, "Datum ist erforderlich."),
  time: z.string().min(1, "Zeit ist erforderlich."),
  notes: z.string().optional(),
});

type CalorieFormValues = z.infer<typeof calorieFormSchema>;

export default function CaloriePage() {
  const { entries, addEntry, deleteEntry } = useCalorieEntries();
  const [open, setOpen] = useState(false);

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

  function onSubmit(data: CalorieFormValues) {
    addEntry(data);
    form.reset({
      ...data,
      food: "",
      calories: 0,
      time: new Date().toTimeString().slice(0, 5),
      notes: "",
    });
  }

  const selectCommonFood = (food: { name: string; calories: number }) => {
    form.setValue("food", food.name);
    form.setValue("calories", food.calories);
    setOpen(false);
  };

  // Tagesstatistiken berechnen
  const { statsByMeal, totalCalories } = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayEntries = entries.filter((e) => e.date === today);

    const statsByMeal = MEAL_TYPES.reduce((acc, meal) => {
      acc[meal.value] = todayEntries
        .filter((e) => e.meal === meal.value)
        .reduce((sum, e) => sum + e.calories, 0);
      return acc;
    }, {} as Record<string, number>);

    const totalCalories = Object.values(statsByMeal).reduce(
      (sum, cal) => sum + cal,
      0
    );

    return { statsByMeal, totalCalories };
  }, [entries]);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Kalorien Tracker</h1>

      {/* Tagesübersicht */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            Heute ({new Date().toLocaleDateString("de-DE")})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {MEAL_TYPES.map((meal) => (
              <div key={meal.value} className="text-center">
                <div className="text-2xl mb-1">{meal.emoji}</div>
                <div className="text-sm text-muted-foreground">
                  {meal.label}
                </div>
                <div className="text-lg font-semibold">
                  {statsByMeal[meal.value]} kcal
                </div>
              </div>
            ))}
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold">
              Gesamt: {totalCalories} kcal
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eingabeform */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Neue Mahlzeit erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Mahlzeit */}
                <FormField
                  control={form.control}
                  name="meal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mahlzeit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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

                {/* Lebensmittel */}
                <FormField
                  control={form.control}
                  name="food"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Lebensmittel</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value || "Lebensmittel wählen..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Lebensmittel suchen..." />
                            <CommandList>
                              <CommandEmpty>
                                Kein Lebensmittel gefunden.
                              </CommandEmpty>
                              <CommandGroup>
                                {COMMON_FOODS.map((food) => (
                                  <CommandItem
                                    value={food.name}
                                    key={food.name}
                                    onSelect={() => selectCommonFood(food)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        food.name === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {food.name} ({food.calories} kcal)
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Kalorien */}
                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kalorien</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Datum */}
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

                {/* Zeit */}
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

                {/* Notizen */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notizen (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. Portion, Zubereitung..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Button */}
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    Eintrag speichern
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Datenvisualisierung */}
      {entries.length > 0 ? (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Diagramm</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Kalorienverlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <CalorieChart data={entries} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Alle Einträge ({entries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CalorieTable data={entries} onDelete={deleteEntry} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Noch keine Einträge vorhanden. Erfassen Sie Ihre erste Mahlzeit!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
