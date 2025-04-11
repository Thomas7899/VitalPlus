'use server'

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Validierung der Datumswerte
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if ((fromDate && isNaN(fromDate.getTime())) || (toDate && isNaN(toDate.getTime()))) {
    return NextResponse.json(
      { error: "Ungültige Datumswerte" },
      { status: 400 }
    );
  }

  const data = await prisma.healthData.findMany({
    where: {
      ...(userId ? { userId } : {}),
      ...(fromDate || toDate
        ? {
            date: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(data);
}