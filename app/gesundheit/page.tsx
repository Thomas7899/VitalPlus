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
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers);
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setData([]);
      return;
    }

    const params = new URLSearchParams();
    params.append("userId", selectedUser);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    fetch(`/api/health?${params.toString()}`)
      .then((res) => res.json())
      .then(setData);
  }, [selectedUser, from, to]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gesundheitsdaten</h1>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="max-w-sm">
          <label className="block text-sm font-medium mb-1">Nutzer</label>
          <Select onValueChange={setSelectedUser}>
            <SelectTrigger>
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
          <label className="block text-sm font-medium mb-1">Von</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            onChange={(e) => setFrom(e.target.value || null)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bis</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            onChange={(e) => setTo(e.target.value || null)}
          />
        </div>
      </div>

      {!selectedUser && (
        <div className="text-gray-500 text-center mt-10">
          🧑‍⚕️ Bitte wähle einen Nutzer aus, um Gesundheitsdaten anzuzeigen.
        </div>
      )}

      {selectedUser && (
        <>
          <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex flex-wrap">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tabs defaultValue={metricsByCategory[0]?.key}>
            <TabsList className="flex flex-wrap">
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
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
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
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      {metricsByCategory.map((metric) => {
                        let emoji = "";
                        if (
                          metric.key === "sleepHours" &&
                          typeof entry.sleepHours === "number"
                        ) {
                          emoji = getSleepEmoji(entry.sleepHours).split(" ")[0];
                        }
                        if (
                          metric.key === "bmi" &&
                          typeof entry.bmi === "number"
                        ) {
                          emoji = getBMIEmoji(entry.bmi).split(" ")[0];
                        }
                        if (
                          metric.key === "bloodPressure" &&
                          typeof entry.bloodPressure === "string"
                        ) {
                          emoji = getBloodPressureEmoji(entry.bloodPressure).split(" ")[0];
                        }
                        return (
                          <TableCell key={metric.key}>
                            {entry[metric.key as keyof HealthData] ?? "-"} {emoji}
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
