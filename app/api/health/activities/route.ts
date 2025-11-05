// app/api/health/activities/route.ts
import { NextResponse } from "next/server";
import { getDashboardActivities } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
    }

    const activities = await getDashboardActivities(userId);
    return NextResponse.json(activities);
  } catch (error) {
    console.error("💥 Fehler beim Laden der Aktivitäten:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
