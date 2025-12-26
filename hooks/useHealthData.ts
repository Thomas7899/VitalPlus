// hooks/useHealthData.ts
import useSWR from "swr";

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
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodGroup?: string;
  bmi?: number;
  bodyTemp?: number;
  oxygenSaturation?: number;
  stairSteps?: number;
  elevation?: number;
  muscleMass?: number;
  bodyFat?: number;
  mealType?: string;
  medications?: string;
};

const fetcher = async (url: string): Promise<HealthData[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Fehler beim Laden der Gesundheitsdaten");
    throw error;
  }
  return res.json();
};

/**
 * Hook für Gesundheitsdaten mit SWR (Stale-While-Revalidate)
 * - Automatische Deduplication von Anfragen
 * - Caching & Revalidation
 * - Optimistische Updates möglich
 */
export function useHealthData(
  userId: string | null | undefined,
  from?: string | null,
  to?: string | null
) {
  // Baue den API-Key nur wenn userId vorhanden
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (from) params.append("from", from);
  if (to) params.append("to", to);

  const swrKey = userId ? `/api/health?${params.toString()}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<HealthData[]>(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false, // Nicht bei Tab-Wechsel neu laden
      revalidateOnReconnect: true, // Bei Reconnect neu laden
      dedupingInterval: 5000, // 5s Dedupe
      keepPreviousData: true, // Alte Daten behalten während Revalidation
    }
  );

  return {
    data: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate, // Für manuelle Revalidation/Optimistic Updates
    swrKey, // Für externe mutate() Aufrufe
  };
}

/**
 * Helper: SWR Key für Health Data
 */
export const getHealthSwrKey = (userId: string) => `/api/health?userId=${userId}`;
