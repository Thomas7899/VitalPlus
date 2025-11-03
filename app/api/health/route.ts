export const dynamic = "force-dynamic";

import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// 🧩 Zod-Schema zur Validierung der Eingabedaten
const healthSchema = z.object({
  userId: z.string().min(1, "userId ist erforderlich"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Ungültiges Datum" }),
  steps: z.number().int().optional(),
  heartRate: z.number().int().optional(),
  sleepHours: z.number().optional(),
  weight: z.number().optional(),
  calories: z.number().optional(),
  respiratoryRate: z.number().int().optional(),
  bloodPressureSystolic: z.number().int().optional(),
  bloodPressureDiastolic: z.number().int().optional(),
  bloodGroup: z.string().optional(),
  bmi: z.number().optional(),
  bodyTemp: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  stairSteps: z.number().int().optional(),
  elevation: z.number().optional(),
  muscleMass: z.number().optional(),
  bodyFat: z.number().optional(),
  mealType: z.string().optional(),
  medications: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validierung mit Zod
    const parseResult = healthSchema.safeParse(body);
    if (!parseResult.success) {
      const errorDetails = parseResult.error.flatten();
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: errorDetails },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 🗃️ Einfügen eines Datensatzes in Drizzle
    const [healthEntry] = await db
      .insert(healthData)
      .values({
        userId: data.userId,
        date: new Date(data.date),
        steps: data.steps,
        heartRate: data.heartRate,
        sleepHours: data.sleepHours,
        weight: data.weight,
        calories: data.calories,
        respiratoryRate: data.respiratoryRate,
        bloodPressureSystolic: data.bloodPressureSystolic,
        bloodPressureDiastolic: data.bloodPressureDiastolic,
        bloodGroup: data.bloodGroup,
        bmi: data.bmi,
        bodyTemp: data.bodyTemp,
        oxygenSaturation: data.oxygenSaturation,
        stairSteps: data.stairSteps,
        elevation: data.elevation,
        muscleMass: data.muscleMass,
        bodyFat: data.bodyFat,
        mealType: data.mealType,
        medications: data.medications,
      })
      .returning(); // Gibt den eingefügten Datensatz zurück

    return NextResponse.json(healthEntry, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Speichern der Gesundheitsdaten:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const conditions = [];

    if (userId) conditions.push(eq(healthData.userId, userId));
    if (from) conditions.push(gte(healthData.date, new Date(from)));
    if (to) conditions.push(lte(healthData.date, new Date(to)));

    // 🗃️ Selektiere Datensätze basierend auf Filtern
    const data = await db
      .select()
      .from(healthData)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(healthData.date)
      .limit(2000);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fehler beim Abrufen der Gesundheitsdaten:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
