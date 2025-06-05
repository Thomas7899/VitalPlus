'use server'

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Zod-Schema zur Validierung der Eingabedaten
const healthSchema = z.object({
  userId: z.string().min(1, "userId ist erforderlich"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Ungültiges Datum" }),
  steps: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  sleepHours: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  calories: z.number().optional(),
  respiratoryRate: z.number().int().optional(),
  bloodPressure: z.string().optional(),
  bloodGroup: z.string().optional(),
  bmi: z.number().optional(),
  bodyTemp: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  stairSteps: z.number().int().optional(),
  elevation: z.number().optional(),
  muscleMass: z.number().optional(),
  bodyFat: z.number().optional(),
  medications: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validierung der Eingabedaten mit Zod
    const parseResult = healthSchema.safeParse(body);

    if (!parseResult.success) {
      const errorDetails = parseResult.error.flatten();
      return NextResponse.json({ error: "Ungültige Eingabedaten", details: errorDetails }, { status: 400 });
    }

    const {
      userId,
      date,
      steps,
      heartRate,
      sleepHours,
      weight,
      height,
      calories,
      respiratoryRate,
      bloodPressure,
      bloodGroup,
      bmi,
      bodyTemp,
      oxygenSaturation,
      stairSteps,
      elevation,
      muscleMass,
      bodyFat,
      medications,
    } = parseResult.data;

    // Erstellen des Gesundheitsdatensatzes in der Datenbank
    const healthEntry = await prisma.healthData.create({
      data: {
        userId,
        date: new Date(date),
        steps,
        heartRate,
        sleepHours,
        weight,
        height,
        calories,
        respiratoryRate,
        bloodPressure,
        bloodGroup,
        bmi,
        bodyTemp,
        oxygenSaturation,
        stairSteps,
        elevation,
        muscleMass,
        bodyFat,
        medications,
      },
    });

    // Erfolgreiche Antwort zurückgeben
    return NextResponse.json(healthEntry, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Speichern der Gesundheitsdaten:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const data = await prisma.healthData.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
      take: 100,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fehler beim Abrufen der Gesundheitsdaten:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}


