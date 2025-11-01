"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const PRESET_VALUES = {
  systolic: [90, 100, 110, 120, 130, 140, 150, 160, 170, 180],
  diastolic: [60, 65, 70, 75, 80, 85, 90, 95, 100, 110],
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

const swrKey = (userId: string) => `/api/health?userId=${userId}`;

export function BloodPressureForm({ userId }: { userId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BloodPressureFormValues>({
    resolver: zodResolver(bloodPressureFormSchema),
    defaultValues: {
      systolic: 120,
      diastolic: 70,
      pulse: 70,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      notes: "",
    },
  });

  const watchedSystolic = form.watch("systolic");
  const watchedDiastolic = form.watch("diastolic");

  const currentCategory = useMemo(() => {
    if (watchedSystolic < 120 && watchedDiastolic < 80)
      return { category: "Normal", color: "text-green-600" };
    if (watchedSystolic < 130 && watchedDiastolic < 80)
      return { category: "Erhöht", color: "text-yellow-600" };
    if (watchedSystolic < 140 && watchedDiastolic < 90)
      return { category: "Bluthochdruck Stufe 1", color: "text-orange-600" };
    if (watchedSystolic < 180 && watchedDiastolic < 120)
      return { category: "Bluthochdruck Stufe 2", color: "text-red-600" };
    return { category: "Hypertensive Krise", color: "text-red-800" };
  }, [watchedSystolic, watchedDiastolic]);

  async function onSubmit(data: BloodPressureFormValues) {
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
      mutate(swrKey(userId));
      form.reset({
        ...form.getValues(),
        time: new Date().toTimeString().slice(0, 5),
        notes: "",
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
                    <Select
                      onValueChange={(value) =>
                        field.onChange(parseInt(value))
                      }
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRESET_VALUES.systolic.map((value) => (
                          <SelectItem key={value} value={value.toString()}>
                            {value}
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
                name="diastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diastolisch (mmHg)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(parseInt(value))
                      }
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRESET_VALUES.diastolic.map((value) => (
                          <SelectItem key={value} value={value.toString()}>
                            {value}
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
                name="pulse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puls (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            parseInt(e.target.value) || undefined
                          )
                        }
                      />
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
                      <Input
                        placeholder="z.B. nach dem Sport, morgens..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !userId}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isSubmitting ? "Speichern..." : "Messung speichern"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {watchedSystolic}/{watchedDiastolic} mmHg
            </span>
            <span className={`font-medium ${currentCategory.color}`}>
              {currentCategory.category}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}