import { useState, useEffect, useCallback } from 'react';

export interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  date: string;
  time: string;
  notes?: string;
}

export function useBloodPressure() {
  const [readings, setReadings] = useState<BloodPressureReading[]>([]);

  useEffect(() => {
    try {
      const savedReadings = localStorage.getItem('bloodPressureReadings');
      if (savedReadings) {
        setReadings(JSON.parse(savedReadings));
      }
    } catch (error) {
      console.error("Failed to load blood pressure readings from localStorage", error);
      setReadings([]);
    }
  }, []);

  const updateLocalStorage = (updatedReadings: BloodPressureReading[]) => {
    localStorage.setItem('bloodPressureReadings', JSON.stringify(updatedReadings));
  };

  const addReading = useCallback((newReadingData: Omit<BloodPressureReading, 'id'>) => {
    const newReading: BloodPressureReading = {
      id: Date.now().toString(),
      ...newReadingData,
    };

    const updatedReadings = [...readings, newReading].sort((a, b) => 
      new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime()
    );
    
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
