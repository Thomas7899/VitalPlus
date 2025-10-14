export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getHealthInsights } from "@/lib/health-insights";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId fehlt" }, { status: 400 });
  }

  try {
    const insights = await getHealthInsights(userId);
    return NextResponse.json(insights);
  } catch (error) {
    console.error("Health insights error:", error);
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}