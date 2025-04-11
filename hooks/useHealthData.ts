import { useEffect, useState } from "react";

export type HealthData = {
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

export function useHealthData(userId: string | null, from?: string | null, to?: string | null) {
  const [data, setData] = useState<HealthData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setData([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("userId", userId);
        if (from) params.append("from", from);
        if (to) params.append("to", to);

        const res = await fetch(`/api/health?${params.toString()}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, from, to]);

  return { data, isLoading, error };
}
