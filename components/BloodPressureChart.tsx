"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  date: string;
  time: string;
  notes?: string;
}

interface BloodPressureChartProps {
  data: BloodPressureReading[];
}

export function BloodPressureChart({ data }: BloodPressureChartProps) {
  const chartData = data
    .slice(-30) // Letzten 30 Messungen
    .reverse()
    .map(reading => ({
      ...reading,
      dateTime: `${reading.date} ${reading.time}`,
      displayDate: new Date(reading.date).toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit' 
      })
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="font-semibold">{new Date(data.dateTime).toLocaleString('de-DE')}</p>
          <p className="text-red-600">Systolisch: {data.systolic} mmHg</p>
          <p className="text-blue-600">Diastolisch: {data.diastolic} mmHg</p>
          {data.pulse && <p className="text-green-600">Puls: {data.pulse} bpm</p>}
          {data.notes && <p className="text-gray-600 text-sm">"{data.notes}"</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="displayDate" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[50, 200]}
            tick={{ fontSize: 12 }}
            label={{ value: 'mmHg', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Referenzlinien für normale Werte */}
          <ReferenceLine y={120} stroke="#10B981" strokeDasharray="5 5" opacity={0.7} />
          <ReferenceLine y={80} stroke="#10B981" strokeDasharray="5 5" opacity={0.7} />
          
          <Line 
            type="monotone" 
            dataKey="systolic" 
            stroke="#EF4444" 
            strokeWidth={2}
            name="Systolisch"
            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="diastolic" 
            stroke="#3B82F6" 
            strokeWidth={2}
            name="Diastolisch"
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          />
          {chartData.some(d => d.pulse) && (
            <Line 
              type="monotone" 
              dataKey="pulse" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Puls"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}