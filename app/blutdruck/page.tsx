"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BloodPressureChart } from "@/components/BloodPressureChart";
import { BloodPressureTable } from "@/components/BloodPressureTable";

interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  date: string;
  time: string;
  notes?: string;
}

const PRESET_VALUES = {
  systolic: [90, 100, 110, 120, 130, 140, 150, 160, 170, 180],
  diastolic: [60, 65, 70, 75, 80, 85, 90, 95, 100, 110]
};

export default function BloodPressurePage() {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);
  const [formData, setFormData] = useState({
    systolic: 120,
    diastolic: 70,
    pulse: 70,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: ""
  });

  // Lokale Daten laden
  useEffect(() => {
    const savedReadings = localStorage.getItem('bloodPressureReadings');
    if (savedReadings) {
      setReadings(JSON.parse(savedReadings));
    }
  }, []);

  // Daten speichern
  const saveReading = () => {
    const newReading: BloodPressureReading = {
      id: Date.now().toString(),
      ...formData
    };
    
    const updatedReadings = [...readings, newReading].sort((a, b) => 
      new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
    );
    
    setReadings(updatedReadings);
    localStorage.setItem('bloodPressureReadings', JSON.stringify(updatedReadings));
    
    // Form zurücksetzen mit neuer Zeit
    setFormData({
      ...formData,
      time: new Date().toTimeString().slice(0, 5),
      notes: ""
    });
  };

  const deleteReading = (id: string) => {
    const updatedReadings = readings.filter(r => r.id !== id);
    setReadings(updatedReadings);
    localStorage.setItem('bloodPressureReadings', JSON.stringify(updatedReadings));
  };

  const getBloodPressureCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return { category: "Normal", color: "text-green-600" };
    if (systolic < 130 && diastolic < 80) return { category: "Erhöht", color: "text-yellow-600" };
    if (systolic < 140 || diastolic < 90) return { category: "Bluthochdruck Stufe 1", color: "text-orange-600" };
    if (systolic < 180 || diastolic < 120) return { category: "Bluthochdruck Stufe 2", color: "text-red-600" };
    return { category: "Hypertensive Krise", color: "text-red-800" };
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Blutdruck Monitor</h1>

      {/* Eingabeform */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Neue Messung erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Systolisch */}
            <div>
              <Label htmlFor="systolic">Systolisch (mmHg)</Label>
              <Select 
                value={formData.systolic.toString()} 
                onValueChange={(value) => setFormData({...formData, systolic: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_VALUES.systolic.map(value => (
                    <SelectItem key={value} value={value.toString()}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Diastolisch */}
            <div>
              <Label htmlFor="diastolic">Diastolisch (mmHg)</Label>
              <Select 
                value={formData.diastolic.toString()} 
                onValueChange={(value) => setFormData({...formData, diastolic: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_VALUES.diastolic.map(value => (
                    <SelectItem key={value} value={value.toString()}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Puls */}
            <div>
              <Label htmlFor="pulse">Puls (optional)</Label>
              <Input
                id="pulse"
                type="number"
                value={formData.pulse}
                onChange={(e) => setFormData({...formData, pulse: parseInt(e.target.value) || 0})}
                min="40"
                max="200"
              />
            </div>

            {/* Datum */}
            <div>
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>

            {/* Zeit */}
            <div>
              <Label htmlFor="time">Zeit</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>

            {/* Notizen */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Input
                id="notes"
                placeholder="z.B. nach dem Sport, morgens..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={saveReading} className="w-full">
                Messung speichern
              </Button>
            </div>
          </div>

          {/* Aktuelle Bewertung */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">
                {formData.systolic}/{formData.diastolic} mmHg
              </span>
              <span className={`font-medium ${getBloodPressureCategory(formData.systolic, formData.diastolic).color}`}>
                {getBloodPressureCategory(formData.systolic, formData.diastolic).category}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datenvisualisierung */}
      {readings.length > 0 && (
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
                <BloodPressureChart data={readings} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Messwerte ({readings.length} Einträge)</CardTitle>
              </CardHeader>
              <CardContent>
                <BloodPressureTable data={readings} onDelete={deleteReading} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {readings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Noch keine Messungen vorhanden. Erfassen Sie Ihre erste Messung!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}