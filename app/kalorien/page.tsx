"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalorieChart } from "@/components/health/CalorieChart";
import { CalorieTable } from "@/components/health/CalorieTable";
import { CalorieEntryForm } from "@/components/health/CalorieEntryForm";

export type MealType = "Frühstück" | "Mittagessen" | "Abendessen" | "Snacks";

interface HealthDataApiResponse {
  id: string;
  date: string;
  calories: number | null;
  mealType: string | null;
  notes: string | null;
}

export interface CalorieData {
  id: string;
  date: string;
  time: string;
  meal: MealType;
  food: string;
  calories: number;
  notes?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function KalorienPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { mutate } = useSWRConfig();

  const swrKey = userId ? `/api/health?userId=${userId}` : null;
  const { data: healthData = [], error, isLoading } = useSWR<HealthDataApiResponse[]>(
    swrKey,
    fetcher
  );

  const calorieData: CalorieData[] = useMemo(() =>
    healthData
      .filter((d) => d.calories != null)
      .map((d) => {
        const [food, ...notesParts] = d.notes?.split('::') || [];
        const notes = notesParts.join('::') || undefined;
        return {
          id: d.id,
          date: new Date(d.date).toISOString().split('T')[0],
          time: new Date(d.date).toTimeString().slice(0, 5),
          meal: (d.mealType || 'Snacks') as MealType,
          food: food || 'Unbekannt',
          calories: d.calories!,
          notes: notes,
        };
      })
      .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime()),
    [healthData]
  );

  const handleEntrySaved = () => {
    if (swrKey) {
      mutate(swrKey);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Kalorien Tracker</h1>

      <CalorieEntryForm userId={userId} onEntrySaved={handleEntrySaved} />

      <HealthDataDisplay
        status={status}
        isLoading={isLoading}
        error={error}
        userId={userId}
        data={calorieData}
      />
    </div>
  );
}

interface HealthDataDisplayProps {
  status: "loading" | "authenticated" | "unauthenticated";
  isLoading: boolean;
  error: any;
  userId: string | undefined;
  data: CalorieData[];
}

function HealthDataDisplay({ status, isLoading, error, userId, data }: HealthDataDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8 flex justify-center items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Lade Kaloriendaten...</p>
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

  if (status === "unauthenticated") {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <LogIn className="h-12 w-12 text-slate-400" />
            <h3 className="text-xl font-semibold">Bitte melden Sie sich an</h3>
            <p className="text-muted-foreground">
              Um Ihre Kaloriendaten zu sehen und zu verwalten, müssen Sie angemeldet sein.
            </p>
            <Button asChild>
              <Link href="/login">Zum Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userId && data.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Noch keine Kaloriendaten vorhanden. Erfassen Sie Ihre erste Mahlzeit!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userId && data.length > 0) {
    return (
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chart">Diagramm</TabsTrigger>
          <TabsTrigger value="table">Tabelle</TabsTrigger>
        </TabsList>
        <TabsContent value="chart">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-2 md:p-6">
              <CalorieChart data={data} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Alle Einträge ({data.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CalorieTable
                data={data}
                onDelete={() => toast.info("Löschen noch nicht implementiert.")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  }

  return null;
}