// lib/alert-history.ts
import { db } from "@/db/client";
import { alertHistory, users } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export type AlertType = 
  | "blood_pressure_high"
  | "blood_pressure_low"
  | "heart_rate_high"
  | "heart_rate_low"
  | "oxygen_low"
  | "steps_low"
  | "sleep_low"
  | "calories_high";

export type AlertSeverity = "warning" | "critical";

interface AlertEntry {
  userId: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  value?: number;
  threshold?: number;
}

/**
 * Speichert einen Alert in der History
 */
export async function saveAlert(alert: AlertEntry): Promise<void> {
  try {
    await db.insert(alertHistory).values({
      userId: alert.userId,
      alertType: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold,
    });
  } catch (error) {
    console.warn("Alert-Speicherung fehlgeschlagen:", error);
  }
}

/**
 * Speichert mehrere Alerts auf einmal
 */
export async function saveAlerts(alerts: AlertEntry[]): Promise<void> {
  if (alerts.length === 0) return;
  
  try {
    await db.insert(alertHistory).values(
      alerts.map((a) => ({
        userId: a.userId,
        alertType: a.alertType,
        severity: a.severity,
        message: a.message,
        value: a.value,
        threshold: a.threshold,
      }))
    );
  } catch (error) {
    console.warn("Alerts-Speicherung fehlgeschlagen:", error);
  }
}

/**
 * Holt die Alert-History eines Benutzers
 */
export async function getAlertHistory(
  userId: string,
  days = 30,
  limit = 50
): Promise<typeof alertHistory.$inferSelect[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return db
    .select()
    .from(alertHistory)
    .where(
      and(
        eq(alertHistory.userId, userId),
        gte(alertHistory.createdAt, fromDate)
      )
    )
    .orderBy(desc(alertHistory.createdAt))
    .limit(limit);
}

/**
 * Zählt Alerts nach Typ für einen Zeitraum
 */
export async function getAlertStats(
  userId: string,
  days = 30
): Promise<Record<AlertType, number>> {
  const history = await getAlertHistory(userId, days, 1000);
  
  const stats: Record<string, number> = {};
  for (const alert of history) {
    stats[alert.alertType] = (stats[alert.alertType] || 0) + 1;
  }
  
  return stats as Record<AlertType, number>;
}

/**
 * Markiert einen Alert als bestätigt
 */
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await db
    .update(alertHistory)
    .set({ acknowledged: true })
    .where(eq(alertHistory.id, alertId));
}

/**
 * Holt personalisierte Alert-Grenzwerte für einen Benutzer
 */
export async function getUserAlertThresholds(userId: string) {
  const user = await db
    .select({
      activityLevel: users.activityLevel,
      healthGoal: users.healthGoal,
      customAlertThresholds: users.customAlertThresholds,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0) return getDefaultThresholds("normal", "gesund_bleiben");

  const { activityLevel, healthGoal, customAlertThresholds } = user[0];
  const defaults = getDefaultThresholds(activityLevel, healthGoal);

  // Custom Thresholds überschreiben Defaults
  return {
    ...defaults,
    ...customAlertThresholds,
  };
}

/**
 * Standard-Grenzwerte basierend auf Aktivitätslevel und Ziel
 */
function getDefaultThresholds(
  activityLevel: string | null,
  healthGoal: string | null
) {
  // Basis-Grenzwerte
  const defaults = {
    maxHeartRate: 85,
    minHeartRate: 50,
    maxSystolic: 140,
    maxDiastolic: 90,
    minOxygen: 95,
    minSteps: 4000,
    minSleep: 6,
    maxCalories: 2500,
  };

  // Anpassungen für Sportler
  if (activityLevel === "athlete" || activityLevel === "active") {
    defaults.maxHeartRate = 95; // Sportler haben oft höhere Ruhepulse nach Training
    defaults.minHeartRate = 40; // Sportler können sehr niedrige Ruhepulse haben
    defaults.minSteps = 8000; // Höhere Bewegungserwartung
    defaults.maxCalories = 3500; // Mehr Kalorien erlaubt
  }

  // Anpassungen für sitzende Lebensweise
  if (activityLevel === "sedentary") {
    defaults.minSteps = 2000; // Niedrigere Erwartung
    defaults.maxCalories = 2000; // Weniger Kalorien
  }

  // Anpassungen für Abnehmziel
  if (healthGoal === "abnehmen") {
    defaults.maxCalories = 1800; // Kaloriendefizit
    defaults.minSteps = 6000; // Mehr Bewegung
  }

  // Anpassungen für Muskelaufbau
  if (healthGoal === "muskelaufbau") {
    defaults.maxCalories = 3000; // Kalorienüberschuss
    defaults.minSteps = 5000;
  }

  return defaults;
}
