"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CalorieEntry {
  id: string;
  meal: 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snacks';
  food: string;
  calories: number;
  date: string;
  time: string;
  notes?: string;
}

interface CalorieChartProps {
  data: CalorieEntry[];
}

const MEAL_COLORS = {
  'Frühstück': '#10B981',
  'Mittagessen': '#3B82F6', 
  'Abendessen': '#F59E0B',
  'Snacks': '#EF4444'
};

export function CalorieChart({ data }: CalorieChartProps) {
  // Tägliche Daten gruppieren
  const dailyData = data.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        displayDate: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        Frühstück: 0,
        Mittagessen: 0,
        Abendessen: 0,
        Snacks: 0,
        total: 0
      };
    }
    acc[date][entry.meal] += entry.calories;
    acc[date].total += entry.calories;
    return acc;
  }, {} as Record<string, any>);

  const chartData = Object.values(dailyData)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Letzten 14 Tage

  // Heutige Daten für Pie Chart
  const today = new Date().toISOString().split('T')[0];
  const todayData = data
    .filter(entry => entry.date === today)
    .reduce((acc, entry) => {
      const existing = acc.find(item => item.name === entry.meal);
      if (existing) {
        existing.value += entry.calories;
      } else {
        acc.push({
          name: entry.meal,
          value: entry.calories,
          color: MEAL_COLORS[entry.meal]
        });
      }
      return acc;
    }, [] as Array<{ name: string; value: number; color: string }>);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }}>
              {item.dataKey}: {item.value} kcal
            </p>
          ))}
          <p className="font-semibold border-t pt-1">Gesamt: {total} kcal</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Täglicher Verlauf */}
      <div>
        <h4 className="text-md font-semibold mb-4 text-white">Täglicher Kalorienverlauf (14 Tage)</h4>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'kcal', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Frühstück" stackId="a" fill={MEAL_COLORS.Frühstück} />
              <Bar dataKey="Mittagessen" stackId="a" fill={MEAL_COLORS.Mittagessen} />
              <Bar dataKey="Abendessen" stackId="a" fill={MEAL_COLORS.Abendessen} />
              <Bar dataKey="Snacks" stackId="a" fill={MEAL_COLORS.Snacks} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heutige Verteilung */}
      {todayData.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-4 text-white">Heutige Kalorienverteilung</h4>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={todayData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} kcal (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {todayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} kcal`, 'Kalorien']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}