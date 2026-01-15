// lib/date-utils.ts
/**
 * 📅 Dynamische Datums-Utilities für Jahr-agnostische Queries
 * 
 * WICHTIG für 2026-Readiness:
 * - Alle Funktionen arbeiten mit dem AKTUELLEN Datum
 * - Keine hardcodierten Jahreszahlen
 * - Timezone-sichere Implementierung
 */

// ============================================
// 🕐 GRUNDLEGENDE ZEIT-FUNKTIONEN
// ============================================

/**
 * Gibt das aktuelle Jahr zurück
 * @example getCurrentYear() // 2026
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Gibt das aktuelle Quartal zurück (1-4)
 */
export function getCurrentQuarter(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

/**
 * Gibt den aktuellen Monat zurück (1-12)
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Erstellt einen ISO-Datumstring für heute um Mitternacht (UTC)
 */
export function getTodayStart(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Erstellt einen ISO-Datumstring für den Jahresanfang
 */
export function getYearStart(year?: number): Date {
  const targetYear = year ?? getCurrentYear();
  return new Date(targetYear, 0, 1, 0, 0, 0, 0);
}

/**
 * Erstellt einen ISO-Datumstring für das Jahresende
 */
export function getYearEnd(year?: number): Date {
  const targetYear = year ?? getCurrentYear();
  return new Date(targetYear, 11, 31, 23, 59, 59, 999);
}

/**
 * Erstellt ein Date für den Monatsanfang
 */
export function getMonthStart(year?: number, month?: number): Date {
  const targetYear = year ?? getCurrentYear();
  const targetMonth = month ?? getCurrentMonth();
  return new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
}

/**
 * Erstellt ein Date für das Monatsende
 */
export function getMonthEnd(year?: number, month?: number): Date {
  const targetYear = year ?? getCurrentYear();
  const targetMonth = month ?? getCurrentMonth();
  // Nächster Monat Tag 0 = letzter Tag des aktuellen Monats
  return new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
}

// ============================================
// 📊 ZEITRAUM-BERECHNUNGEN
// ============================================

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Berechnet einen Zeitraum X Tage zurück
 */
export function getLastNDays(days: number): DateRange {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  
  return { from, to: now };
}

/**
 * Berechnet den Zeitraum für die aktuelle Woche (Montag - Sonntag)
 */
export function getCurrentWeekRange(): DateRange {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const from = new Date(now);
  from.setDate(from.getDate() + mondayOffset);
  from.setHours(0, 0, 0, 0);
  
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  
  return { from, to };
}

/**
 * Berechnet den Zeitraum für den aktuellen Monat
 */
export function getCurrentMonthRange(): DateRange {
  return {
    from: getMonthStart(),
    to: getMonthEnd(),
  };
}

/**
 * Berechnet den Zeitraum für das aktuelle Jahr
 */
export function getCurrentYearRange(): DateRange {
  return {
    from: getYearStart(),
    to: getYearEnd(),
  };
}

/**
 * Berechnet den Zeitraum für das aktuelle Quartal
 */
export function getCurrentQuarterRange(): DateRange {
  const year = getCurrentYear();
  const quarter = getCurrentQuarter();
  const startMonth = (quarter - 1) * 3;
  
  return {
    from: new Date(year, startMonth, 1, 0, 0, 0, 0),
    to: new Date(year, startMonth + 3, 0, 23, 59, 59, 999),
  };
}

// ============================================
// ✅ VALIDIERUNG & CHECKS
// ============================================

/**
 * Prüft, ob ein Datum im aktuellen Jahr liegt
 */
export function isCurrentYear(date: Date): boolean {
  return date.getFullYear() === getCurrentYear();
}

/**
 * Prüft, ob ein Datum im aktuellen Monat liegt
 */
export function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

/**
 * Prüft, ob ein Datum heute ist
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Berechnet die Anzahl der Tage seit Jahresbeginn
 */
export function getDaysIntoYear(date?: Date): number {
  const target = date ?? new Date();
  const yearStart = getYearStart(target.getFullYear());
  const diff = target.getTime() - yearStart.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Berechnet den Fortschritt im Jahr als Prozent (0-100)
 */
export function getYearProgress(date?: Date): number {
  const target = date ?? new Date();
  const year = target.getFullYear();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const totalDays = isLeapYear ? 366 : 365;
  
  return Math.round((getDaysIntoYear(target) / totalDays) * 100);
}

// ============================================
// 🔄 JAHRESWECHSEL-ERKENNUNG
// ============================================

export interface YearTransitionInfo {
  currentYear: number;
  previousYear: number;
  daysIntoNewYear: number;
  isEarlyYear: boolean; // Erste 2 Wochen des neuen Jahres
  yearProgress: number;
}

/**
 * Liefert Informationen zum Jahreswechsel
 * Wichtig für "Low Data" Erkennung zu Jahresbeginn
 */
export function getYearTransitionInfo(): YearTransitionInfo {
  const now = new Date();
  const currentYear = now.getFullYear();
  const daysIntoNewYear = getDaysIntoYear(now);
  
  return {
    currentYear,
    previousYear: currentYear - 1,
    daysIntoNewYear,
    isEarlyYear: daysIntoNewYear <= 14,
    yearProgress: getYearProgress(now),
  };
}

/**
 * Berechnet, wieviele Tage Daten für eine aussagekräftige Analyse benötigt werden
 * In den ersten Wochen des Jahres: geringere Anforderungen
 */
export function getMinimumDataDaysForAnalysis(): number {
  const { daysIntoNewYear } = getYearTransitionInfo();
  
  // Dynamische Anpassung basierend auf Position im Jahr
  if (daysIntoNewYear <= 7) return 3;     // Erste Woche: 3 Tage reichen
  if (daysIntoNewYear <= 14) return 5;    // Zweite Woche: 5 Tage
  if (daysIntoNewYear <= 30) return 7;    // Erster Monat: 7 Tage
  return 14;                               // Normal: 14 Tage für Trends
}

// ============================================
// 📆 FORMATIERUNG
// ============================================

/**
 * Formatiert ein Datum für die Anzeige (de-DE)
 */
export function formatDateDE(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formatiert ein Datum mit Uhrzeit
 */
export function formatDateTimeDE(date: Date): string {
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Relativer Zeitstring (z.B. "vor 5 Minuten")
 */
export function getRelativeTimeString(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return "gerade eben";
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Minuten`;
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Stunden`;
  if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
  if (seconds < 2592000) return `vor ${Math.floor(seconds / 604800)} Wochen`;
  
  return formatDateDE(date);
}

// ============================================
// 🏥 HEALTH-SPEZIFISCHE ZEITRÄUME
// ============================================

/**
 * Standard-Zeiträume für Gesundheitsanalysen
 */
export const HEALTH_ANALYSIS_PERIODS = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
} as const;

export type HealthAnalysisPeriod = keyof typeof HEALTH_ANALYSIS_PERIODS;

/**
 * Gibt den passenden Analysezeitraum basierend auf verfügbaren Daten zurück
 */
export function getRecommendedAnalysisPeriod(
  dataPointCount: number,
  oldestDataDate?: Date
): HealthAnalysisPeriod {
  if (!oldestDataDate) {
    // Ohne Daten: Kurzfristiger Fokus
    return "weekly";
  }
  
  const daysSinceOldest = Math.floor(
    (Date.now() - oldestDataDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Mindestens 2 Datenpunkte pro Tag für Aussagekraft
  const avgDataPerDay = dataPointCount / Math.max(daysSinceOldest, 1);
  
  if (avgDataPerDay < 0.5 || daysSinceOldest < 7) return "daily";
  if (daysSinceOldest < 14) return "weekly";
  if (daysSinceOldest < 60) return "biweekly";
  if (daysSinceOldest < 180) return "monthly";
  if (daysSinceOldest < 365) return "quarterly";
  
  return "yearly";
}
