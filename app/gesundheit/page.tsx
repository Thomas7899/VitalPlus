"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

export default function HealthPage() {
  const [data, setData] = useState<HealthData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
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
      .then(res => res.json())
      .then(setData);
  }, [selectedUser, from, to]);

  const metrics = [
    { key: "steps", label: "Schritte", color: "#4F46E5" },
    { key: "heartRate", label: "Herzfrequenz", color: "#EF4444" },
    { key: "sleepHours", label: "Schlafstunden", color: "#10B981" },
    { key: "weight", label: "Gewicht", color: "#F97316" },
    { key: "calories", label: "Kalorien", color: "#F59E0B" },
    { key: "respiratoryRate", label: "Atemfrequenz", color: "#F472B6" },
    { key: "bloodPressure", label: "Blutdruck", color: "#9CA3AF" },
    { key: "bloodGroup", label: "Blutgruppe", color: "#374151" },
    { key: "bmi", label: "BMI", color: "#6366F1" },
    { key: "bodyTemp", label: "Körpertemperatur", color: "#EF7F24" },
    { key: "oxygenSaturation", label: "Sauerstoffsättigung", color: "#34D399" },
    { key: "stairSteps", label: "Treppenstufen", color: "#60A5FA" },
    { key: "elevation", label: "Höhenmeter", color: "#A78BFA" },
    { key: "muscleMass", label: "Muskelmasse", color: "#6B7280" },
    { key: "bodyFat", label: "Körperfettanteil", color: "#EC4899" },
    { key: "medications", label: "Medikamente", color: "#D1D5DB" },
  ] as const;

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
          <Tabs defaultValue="steps" className="space-y-4">
            <TabsList>
              {metrics.map((metric) => (
                <TabsTrigger key={metric.key} value={metric.key}>
                  {metric.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {metrics.map((metric) => (
              <TabsContent key={metric.key} value={metric.key}>
                <Card>
                  <CardContent className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.slice().reverse()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                    {metrics.map((metric) => (
                      <TableHead key={metric.key}>{metric.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      {metrics.map((metric) => (
                        <TableCell key={metric.key}>
                          {entry[metric.key as keyof HealthData] ?? "-"}
                        </TableCell>
                      ))}
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
