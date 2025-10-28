"use client";

import { useState, useEffect, useCallback } from 'react';

export interface VitalFunctionReading {
  id: string;
  heartRate?: number;
  respirationRate?: number;
  oxygenSaturation?: number;
  date: string;
  time: string;
  notes?: string;
}

export function useVitalFunctions() {
  const [readings, setReadings] = useState<VitalFunctionReading[]>([]);

  useEffect(() => {
    try {
      const savedReadings = localStorage.getItem('vitalFunctionReadings');
      if (savedReadings) {
        setReadings(JSON.parse(savedReadings));
      }
    } catch (error) {
      console.error("Failed to load vital function readings from localStorage", error);
    }
  }, []);

  const updateLocalStorage = (updatedReadings: VitalFunctionReading[]) => {
    localStorage.setItem('vitalFunctionReadings', JSON.stringify(updatedReadings));
  };

  const addReading = useCallback((newReadingData: Omit<VitalFunctionReading, 'id'>) => {
    const newReading: VitalFunctionReading = { id: Date.now().toString(), ...newReadingData };
    const updatedReadings = [...readings, newReading].sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());
    setReadings(updatedReadings);
    updateLocalStorage(updatedReadings);
  }, [readings]);

  const deleteReading = useCallback((id: string) => {
    const updatedReadings = readings.filter(r => r.id !== id);
    setReadings(updatedReadings);
    updateLocalStorage(updatedReadings);
  }, [readings]);

  return { readings, addReading, deleteReading };
}