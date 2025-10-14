"use client";

import { useState, useEffect, useCallback } from 'react';

export interface CalorieEntry {
  id: string;
  meal: 'Frühstück' | 'Mittagessen' | 'Abendessen' | 'Snacks';
  food: string;
  calories: number;
  date: string;
  time: string;
  notes?: string;
}

export function useCalorieEntries() {
  const [entries, setEntries] = useState<CalorieEntry[]>([]);

  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('calorieEntries');
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries));
      }
    } catch (error) {
      console.error("Failed to load calorie entries from localStorage", error);
    }
  }, []);

  const updateLocalStorage = (updatedEntries: CalorieEntry[]) => {
    localStorage.setItem('calorieEntries', JSON.stringify(updatedEntries));
  };

  const addEntry = useCallback((newEntryData: Omit<CalorieEntry, 'id'>) => {
    const newEntry: CalorieEntry = { id: Date.now().toString(), ...newEntryData };
    const updatedEntries = [...entries, newEntry].sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
    setEntries(updatedEntries);
    updateLocalStorage(updatedEntries);
  }, [entries]);

  const deleteEntry = useCallback((id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    updateLocalStorage(updatedEntries);
  }, [entries]);

  return { entries, addEntry, deleteEntry };
}