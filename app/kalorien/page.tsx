"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalorieChart } from "@/components/CalorieChart";
import { CalorieTable } from "@/components/CalorieTable";

interface CalorieEntry {
  id: string;
  meal: 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snacks';
  food: string;
  calories: number;
  date: string;
  time: string;
  notes?: string;
}

const MEAL_TYPES = [
  { value: 'Frühstück', label: 'Frühstück', emoji: '🍳' },
  { value: 'Mittagessen', label: 'Mittagessen', emoji: '🍽️' },
  { value: 'Abendessen', label: 'Abendessen', emoji: '🥘' },
  { value: 'Snacks', label: 'Snacks/Sonstiges', emoji: '🍎' }
];

const COMMON_FOODS = [
  { name: 'Apfel', calories: 80 },
  { name: 'Banane', calories: 105 },
  { name: 'Brot (1 Scheibe)', calories: 70 },
  { name: 'Butter (10g)', calories: 75 },
  { name: 'Haferflocken (50g)', calories: 185 },
  { name: 'Joghurt (150g)', calories: 85 },
  { name: 'Milch (200ml)', calories: 120 },
  { name: 'Müsli (50g)', calories: 200 },
  { name: 'Nudeln (100g)', calories: 350 },
  { name: 'Reis (100g)', calories: 350 },
];

export default function CaloriePage() {
  const [entries, setEntries] = useState<CalorieEntry[]>([]);
  const [formData, setFormData] = useState({
    meal: 'Frühstück' as CalorieEntry['meal'],
    food: '',
    calories: 0,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    notes: ""
  });

  // Lokale Daten laden
  useEffect(() => {
    const savedEntries = localStorage.getItem('calorieEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Daten speichern
  const saveEntry = () => {
    if (!formData.food || formData.calories <= 0) return;

    const newEntry: CalorieEntry = {
      id: Date.now().toString(),
      ...formData
    };
    
    const updatedEntries = [...entries, newEntry].sort((a, b) => 
      new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
    );
    
    setEntries(updatedEntries);
    localStorage.setItem('calorieEntries', JSON.stringify(updatedEntries));
    
    // Form zurücksetzen
    setFormData({
      ...formData,
      food: '',
      calories: 0,
      time: new Date().toTimeString().slice(0, 5),
      notes: ""
    });
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('calorieEntries', JSON.stringify(updatedEntries));
  };

  const selectCommonFood = (food: { name: string; calories: number }) => {
    setFormData({
      ...formData,
      food: food.name,
      calories: food.calories
    });
  };

  // Tagesstatistiken berechnen
  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter(e => e.date === today);
    
    const statsByMeal = MEAL_TYPES.reduce((acc, meal) => {
      acc[meal.value] = todayEntries
        .filter(e => e.meal === meal.value)
        .reduce((sum, e) => sum + e.calories, 0);
      return acc;
    }, {} as Record<string, number>);
    
    const totalCalories = Object.values(statsByMeal).reduce((sum, cal) => sum + cal, 0);
    
    return { statsByMeal, totalCalories };
  };

  const { statsByMeal, totalCalories } = getTodayStats();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Kalorien Tracker</h1>

      {/* Tagesübersicht */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Heute ({new Date().toLocaleDateString('de-DE')})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {MEAL_TYPES.map(meal => (
              <div key={meal.value} className="text-center">
                <div className="text-2xl mb-1">{meal.emoji}</div>
                <div className="text-sm text-muted-foreground">{meal.label}</div>
                <div className="text-lg font-semibold">{statsByMeal[meal.value]} kcal</div>
              </div>
            ))}
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold">Gesamt: {totalCalories} kcal</div>
          </div>
        </CardContent>
      </Card>

      {/* Eingabeform */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Neue Mahlzeit erfassen</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Häufige Lebensmittel */}
          <div className="mb-4">
            <Label className="mb-2 block">Häufige Lebensmittel</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {COMMON_FOODS.map(food => (
                <Button
                  key={food.name}
                  variant="outline"
                  size="sm"
                  onClick={() => selectCommonFood(food)}
                  className="text-xs h-auto py-2 flex flex-col items-center"
                >
                  <span className="font-medium">{food.name}</span>
                  <span className="text-xs text-muted-foreground">{food.calories} kcal</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mahlzeit */}
            <div>
              <Label htmlFor="meal">Mahlzeit</Label>
              <Select 
                value={formData.meal} 
                onValueChange={(value: CalorieEntry['meal']) => setFormData({...formData, meal: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map(meal => (
                    <SelectItem key={meal.value} value={meal.value}>
                      {meal.emoji} {meal.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lebensmittel */}
            <div>
              <Label htmlFor="food">Lebensmittel</Label>
              <Input
                id="food"
                placeholder="z.B. Apfel, Brot..."
                value={formData.food}
                onChange={(e) => setFormData({...formData, food: e.target.value})}
              />
            </div>

            {/* Kalorien */}
            <div>
              <Label htmlFor="calories">Kalorien</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({...formData, calories: parseInt(e.target.value) || 0})}
                min="0"
                max="5000"
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
                placeholder="z.B. Portion, Zubereitung..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={saveEntry} 
                className="w-full"
                disabled={!formData.food || formData.calories <= 0}
              >
                Eintrag speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datenvisualisierung */}
      {entries.length > 0 && (
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Diagramm</TabsTrigger>
            <TabsTrigger value="table">Tabelle</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Kalorienverlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <CalorieChart data={entries} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>Alle Einträge ({entries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <CalorieTable data={entries} onDelete={deleteEntry} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {entries.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Noch keine Einträge vorhanden. Erfassen Sie Ihre erste Mahlzeit!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}