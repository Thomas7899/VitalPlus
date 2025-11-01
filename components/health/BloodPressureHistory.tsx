"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BloodPressureChart } from "@/components/health/BloodPressureChart";
import { BloodPressureTable } from "@/components/health/BloodPressureTable";
import { toast } from "sonner";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

const swrKey = (userId: string) => `/api/health?userId=${userId}`;

export function BloodPressureHistory({ userId }: { userId: string }) {
  const { data: readings = [], error, isLoading } = useSWR(
    swrKey(userId),
    fetcher,
    { revalidateOnFocus: false }
  );

  const deleteReading = async (id: string) => {
    toast.info("Löschfunktion noch nicht implementiert.");
  };

  const filteredReadings = useMemo(
    () =>
      readings
        .filter((r: any) => r.bloodPressureSystolic != null)
        .map((r: any) => ({
          id: r.id,
          systolic: r.bloodPressureSystolic,
          diastolic: r.bloodPressureDiastolic,
          pulse: r.heartRate,
          notes: r.notes,
          time: new Date(r.date).toTimeString().slice(0, 5),
          date: new Date(r.date).toISOString().split("T")[0],
        }))
        .sort(
          (a: any, b: any) =>
            new Date(b.date + "T" + b.time).getTime() -
            new Date(a.date + "T" + a.time).getTime()
        ),
    [readings]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8 flex justify-center items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Lade Messungen...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-red-600">
          Fehler beim Laden der Daten.
        </CardContent>
      </Card>
    );
  }

  if (filteredReadings.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Noch keine Messungen vorhanden. Erfassen Sie Ihre erste Messung!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="chart" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="chart">Diagramm</TabsTrigger>
        <TabsTrigger value="table">Tabelle</TabsTrigger>
      </TabsList>
      <TabsContent value="chart">
        <Card>
          <CardHeader>
            <CardTitle>Blutdruckverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <BloodPressureChart data={filteredReadings} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="table">
        <Card>
          <CardHeader>
            <CardTitle>
              Messwerte ({filteredReadings.length} Einträge)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BloodPressureTable
              data={filteredReadings}
              onDelete={deleteReading}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}