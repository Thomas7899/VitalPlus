"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type HealthData = {
  id: string;
  date: string;
  steps?: number;
  heartRate?: number;
  sleepHours?: number;
  weight?: number;
  calories?: number;
  respiratoryRate?: number;
  bloodPressure?: string;
  bloodGroup?: string;
  bmi?: number;
  bodyTemp?: number;
  oxygenSaturation?: number;
  stairSteps?: number;
  elevation?: number;
  muscleMass?: number;
  bodyFat?: number;
  medications?: string;
};

type User = {
  id: string;
  name?: string;
  email: string;
};

const getSleepEmoji = (hours: number) => {
  if (hours >= 7) return "😴 Ausreichend Schlaf";
  if (hours >= 5) return "⚠️ Wenig Schlaf";
  return "🚨 Schlafmangel";
};

const getBMIEmoji = (bmi: number) => {
  if (bmi < 18.5) return "⚠️ Untergewicht";
  if (bmi < 25) return "✅ Normalgewicht";
  if (bmi < 30) return "⚠️ Übergewicht";
  return "🚨 Adipositas";
};

const getBloodPressureEmoji = (bp: string) => {
  const match = bp.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!match) return "";
  const [systolic, diastolic] = match.slice(1).map(Number);

  if (systolic < 90 || diastolic < 60) return "⚠️ Niedriger Blutdruck";
  if (systolic <= 120 && diastolic <= 80) return "✅ Normal";
  if (systolic <= 139 || diastolic <= 89) return "⚠️ Erhöht";
  return "🚨 Hoch";
};

export default function HealthPage() {
  const [data, setData] = useState<HealthData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Fitness");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metrics = [
    { key: "steps", label: "Schritte", color: "#4F46E5", category: "Fitness" },
    { key: "calories", label: "Kalorien", color: "#F59E0B", category: "Fitness" },
    { key: "weight", label: "Gewicht", color: "#F97316", category: "Fitness" },
    { key: "bmi", label: "BMI", color: "#6366F1", category: "Fitness" },
    { key: "muscleMass", label: "Muskelmasse", color: "#6B7280", category: "Fitness" },
    { key: "bodyFat", label: "Körperfettanteil", color: "#EC4899", category: "Fitness" },
    { key: "heartRate", label: "Herzfrequenz", color: "#EF4444", category: "Vitalwerte" },
    { key: "respiratoryRate", label: "Atemfrequenz", color: "#F472B6", category: "Vitalwerte" },
    { key: "oxygenSaturation", label: "Sauerstoffsättigung", color: "#34D399", category: "Vitalwerte" },
    { key: "bloodPressure", label: "Blutdruck", color: "#9CA3AF", category: "Vitalwerte" },
    { key: "sleepHours", label: "Schlafstunden", color: "#10B981", category: "Körperlich" },
    { key: "bodyTemp", label: "Körpertemperatur", color: "#EF7F24", category: "Körperlich" },
    { key: "medications", label: "Medikamente", color: "#D1D5DB", category: "Medikamente" },
  ] as const;

  const categories = [...new Set(metrics.map((m) => m.category))];
  const metricsByCategory = metrics.filter((m) => m.category === activeCategory);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error("Fehler beim Laden der Nutzer");
        return res.json();
      })
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.append("userId", selectedUser);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    fetch(/api/health?${params.toString()})
      .then((res) => {
        if (!res.ok) throw new Error("Fehler beim Laden der Gesundheitsdaten");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [selectedUser, from, to]);

  const formatValue = (value: string | number | null | undefined, key: string): string => {
    if (value === undefined || value === null) return "-";
    switch (key) {
      case "date":
        return new Date(value).toLocaleDateString("de-DE");
      case "weight":
        return ${value} kg;
      case "heartRate":
      case "respiratoryRate":
        return ${value} /min;
      case "oxygenSaturation":
        return ${value}%;
      case "bodyTemp":
        return ${value}°C;
      case "muscleMass":
      case "bodyFat":
        return ${value}%;
      default:
        return value.toString();
    }
  };

  return (
    <div className="p-6 space-y-6 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold">Gesundheitsdaten</h1>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="max-w-sm w-full">
              <label htmlFor="user-select" className="block text-sm font-medium mb-1">
                Nutzer
              </label>
              <Select onValueChange={setSelectedUser}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Nutzer wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name ?? user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="date-from" className="block text-sm font-medium mb-1">
                Von
              </label>
              <input
                id="date-from"
                type="date"
                className="border rounded px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                onChange={(e) => setFrom(e.target.value || null)}
              />
            </div>

            <div>
              <label htmlFor="date-to" className="block text-sm font-medium mb-1">
                Bis
              </label>
              <input
                id="date-to"
                type="date"
                className="border rounded px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-700"
                onChange={(e) => setTo(e.target.value || null)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="bg-red-100 text-red-800 p-4 rounded dark:bg-red-950 dark:text-red-300">
            {error}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Daten werden geladen...</p>
        </div>
      )}

      {!selectedUser && !isLoading && (
        <div className="text-gray-500 dark:text-gray-400 text-center mt-10">
          🧑‍⚕️ Bitte wähle einen Nutzer aus, um Gesundheitsdaten anzuzeigen.
        </div>
      )}

      {selectedUser && !isLoading && !error && (
        <>
          <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tabs defaultValue={metricsByCategory[0]?.key}>
            <TabsList className="flex flex-wrap gap-2 mb-4">
              {metricsByCategory.map((metric) => (
                <TabsTrigger key={metric.key} value={metric.key}>
                  {metric.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {metricsByCategory.map((metric) => (
              <TabsContent key={metric.key} value={metric.key}>
                <Card>
                  <CardContent className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={data.slice().reverse()}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) =>
                            formatValue(Array.isArray(value) ? value[0] : value, metric.key)
                          }
                          labelFormatter={(label: string) =>
                            new Date(label).toLocaleDateString("de-DE")
                          }
                        />
                        <Line
                          type="monotone"
                          dataKey={metric.key}
                          stroke={metric.color}
                          name={metric.label}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    {metricsByCategory.map((metric) => (
                      <TableHead key={metric.key}>{metric.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatValue(entry.date, "date")}</TableCell>
                      {metricsByCategory.map((metric) => {
                        let emoji = "";
                        if (metric.key === "sleepHours" && typeof entry.sleepHours === "number") {
                          emoji = getSleepEmoji(entry.sleepHours).split(" ")[0];
                        }
                        if (metric.key === "bmi" && typeof entry.bmi === "number") {
                          emoji = getBMIEmoji(entry.bmi).split(" ")[0];
                        }
                        if (metric.key === "bloodPressure" && typeof entry.bloodPressure === "string") {
                          emoji = getBloodPressureEmoji(entry.bloodPressure).split(" ")[0];
                        }
                        return (
                          <TableCell key={metric.key}>
                            {formatValue(entry[metric.key as keyof HealthData], metric.key)} {emoji}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}