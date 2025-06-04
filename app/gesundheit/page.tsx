"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealthData } from "@/hooks/useHealthData";
import { useUsers } from "@/hooks/useUsers";
import { HealthFilters } from "@/components/HealthFilters";
import { HealthChart } from "@/components/HealthChart";
import { metrics, categories } from "@/components/metrics";

export default function HealthPage() {
  const { data: users = [] } = useUsers();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const { data: healthData = [], isLoading } = useHealthData(
    selectedUser,
    from,
    to
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Gesundheitsdaten</h1>

      <HealthFilters
        users={users}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        from={from}
        to={to}
        setFrom={setFrom}
        setTo={setTo}
      />

      {isLoading && <p>Lade Gesundheitsdaten...</p>}

      {!isLoading && healthData.length > 0 && (
        <Tabs defaultValue={categories[0]}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
    {metrics
      .filter((m) => m.category === category)
      .map((metric) => (
        <div
          key={metric.key}
          className="bg-gray-800 hover:bg-neutral-900 border border-gray-700 rounded-lg shadow p-4 dark:bg-gray-800 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold mb-2 text-white">{metric.label}</h3>
          <HealthChart data={healthData} metric={metric} />
        </div>
      ))}
  </div>
</TabsContent>

          ))}
        </Tabs>
      )}

      {!isLoading && healthData.length === 0 && selectedUser && (
        <p className="text-muted-foreground">Keine Gesundheitsdaten im gewählten Zeitraum.</p>
      )}
    </div>
  );
}
