import { Gauge, Moon, Weight, Thermometer, LucideIcon } from 'lucide-react';
import { prisma } from './prisma';
import { getHealthInsights } from './health-insights';

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'gerade eben';
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Minuten`;
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Stunden`;
  if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
  const days = Math.floor(seconds / 86400);
  return `vor ${Math.round(days / 7)} Wochen`;
}

export type DashboardStatsData = {
  steps: string;
  calories: string;
  heartRate: string;
  sleep: string;
  stepsChange: string;
  caloriesChange: string;
  heartRateChange: string;
  sleepChange: string;
};

export type DashboardTrendData = {
  id: string;
  title: string;
  value: string;
  change: string;
  color: string;
  icon: LucideIcon;
};

function calculateChange(current: number | null | undefined, previous: number | null | undefined): string {
  if (current == null || previous == null || previous === 0) return "N/A";
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 1) return "Stabil";
  return `${change > 0 ? '+' : ''}${Math.round(change)}%`;
}

export async function getDashboardStats(userId: string): Promise<DashboardStatsData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const healthMetrics = await prisma.healthData.findMany({
    where: { userId, date: { gte: yesterday } },
    orderBy: { date: 'asc' },
  });

  const todayData = healthMetrics.filter(m => new Date(m.date) >= today);
  const yesterdayData = healthMetrics.filter(m => new Date(m.date) >= yesterday && new Date(m.date) < today);

  const sum = (arr: (number | null | undefined)[]) =>
    arr.filter((n): n is number => typeof n === 'number').reduce((a, b) => a + b, 0);

  const avg = (arr: (number | null | undefined)[]) => {
    const vals = arr.filter((n): n is number => typeof n === 'number');
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const latestTodayData = todayData[todayData.length - 1];
  const latestYesterdayData = yesterdayData[yesterdayData.length - 1];

  const todayStats = {
    steps: latestTodayData?.steps ?? 0,
    calories: latestTodayData?.calories ?? 0,
    heartRate: avg(todayData.map(d => d.heartRate)),
    sleepHours: avg(todayData.map(d => d.sleepHours)),
  };

  const yesterdayStats = {
    steps: latestYesterdayData?.steps ?? 0,
    calories: latestYesterdayData?.calories ?? 0,
    heartRate: avg(yesterdayData.map(d => d.heartRate)),
    sleepHours: avg(yesterdayData.map(d => d.sleepHours)),
  };

  return {
    steps: todayStats.steps.toLocaleString('de-DE'),
    calories: todayStats.calories.toLocaleString('de-DE'),
    heartRate: todayStats.heartRate ? `${Math.round(todayStats.heartRate)} bpm` : 'N/A',
    sleep: todayStats.sleepHours ? `${todayStats.sleepHours.toFixed(1)}h` : 'N/A',
    stepsChange: calculateChange(todayStats.steps, yesterdayStats.steps),
    caloriesChange: calculateChange(todayStats.calories, yesterdayStats.calories),
    heartRateChange: calculateChange(todayStats.heartRate, yesterdayStats.heartRate),
    sleepChange: calculateChange(todayStats.sleepHours, yesterdayStats.sleepHours),
  };
}

export async function getDashboardActivities(userId: string) {
  const activities = await prisma.healthData.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 3,
  });

  const createTitle = (activity: (typeof activities)[0]) =>
    activity.mealType ? `${activity.mealType} erfasst` : 'Aktivität erfasst';

  const createDescription = (activity: (typeof activities)[0]) =>
    activity.calories ? `${activity.calories} kcal` : 'Keine weiteren Details';

  return activities.map(activity => ({
    id: activity.id,
    type: activity.mealType ? 'MEAL' : 'DEFAULT',
    title: createTitle(activity),
    description: createDescription(activity),
    timeAgo: timeAgo(activity.date),
  }));
}

export type DashboardActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timeAgo: string;
};

export type DashboardActivityData = DashboardActivityItem[];

export async function getDashboardTrends(userId: string): Promise<DashboardTrendData[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const healthMetrics = await prisma.healthData.findMany({
    where: { userId, date: { gte: yesterday } },
    orderBy: { date: 'asc' },
  });

  const todayData = healthMetrics.filter(m => new Date(m.date) >= today);
  const yesterdayData = healthMetrics.filter(m => new Date(m.date) >= yesterday && new Date(m.date) < today);

  const avg = (arr: (number | null | undefined)[]) => {
    const vals = arr.filter((n): n is number => typeof n === 'number');
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const latest = todayData[todayData.length - 1] ?? yesterdayData[yesterdayData.length - 1];

  return [
    { id: 'heartRate', title: "Herzfrequenz", value: latest?.heartRate ? `${Math.round(latest.heartRate)} bpm` : 'N/A', change: calculateChange(avg(todayData.map(d => d.heartRate)), avg(yesterdayData.map(d => d.heartRate))), color: "purple", icon: Gauge },
    { id: 'weight', title: "Gewicht", value: latest?.weight ? `${latest.weight.toFixed(1)} kg` : 'N/A', change: calculateChange(avg(todayData.map(d => d.weight)), avg(yesterdayData.map(d => d.weight))), color: "blue", icon: Weight },
    { id: 'bodyTemp', title: "Körpertemperatur", value: latest?.bodyTemp ? `${latest.bodyTemp.toFixed(1)} °C` : 'N/A', change: calculateChange(avg(todayData.map(d => d.bodyTemp)), avg(yesterdayData.map(d => d.bodyTemp))), color: "orange", icon: Thermometer },
    { id: 'sleepDuration', title: "Schlafdauer", value: latest?.sleepHours ? `${latest.sleepHours.toFixed(1)}h` : 'N/A', change: calculateChange(avg(todayData.map(d => d.sleepHours)), avg(yesterdayData.map(d => d.sleepHours))), color: "purple", icon: Moon },
  ];
}

export async function getHealthInsightsData(userId: string) {
  const insights = await getHealthInsights(userId);
  if (insights.length === 0) {
    return {
      title: "Dein wöchentlicher Einblick",
      insight: "Es sind noch nicht genügend Daten für eine detaillierte Analyse vorhanden.",
      recommendation: "Erfasse deine Gesundheitsdaten regelmäßig, um wertvolle Einblicke zu erhalten.",
    };
  }

  const primaryInsight = insights[0];
  return {
    title: "Dein wöchentlicher Einblick",
    insight: `Dein Trend für '${primaryInsight.metric}' ist ${primaryInsight.trend}.`,
    recommendation: primaryInsight.recommendation,
  };
}

export type HealthInsightData = Awaited<ReturnType<typeof getHealthInsightsData>>;