// app/api/health/route.ts
import { db } from "@/db/client";
import { healthData } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateHealthEmbeddingForUser } from "@/lib/health-insights";
import { auth } from "@/lib/auth";
import { revalidateTag } from "next/cache";

// 🔐 Authentifizierungsprüfung
async function authenticateRequest() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Nicht authentifiziert", status: 401, userId: null };
  }
  return { error: null, status: 200, userId: session.user.id };
}

const healthSchema = z.object({
  userId: z.string().min(1, "userId ist erforderlich").optional(), // Optional - wird aus Session genommen
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
    // 🔐 Authentifizierung prüfen
    const authResult = await authenticateRequest();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const parseResult = healthSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    
    // 🔐 User kann nur eigene Daten speichern - userId aus Session verwenden
    const targetUserId = data.userId || authResult.userId!;
    if (data.userId && data.userId !== authResult.userId) {
      return NextResponse.json(
        { error: "Zugriff verweigert: Sie können nur eigene Daten speichern" },
        { status: 403 }
      );
    }

    const [healthEntry] = await db
      .insert(healthData)
      .values({
        userId: targetUserId,
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
      .returning();

    // 🔄 Cache invalidieren für Dashboard-Stats
    revalidateTag("health-data");

    // 🔄 Embedding im Hintergrund aktualisieren
    updateHealthEmbeddingForUser(targetUserId).catch((err) =>
      console.warn("⚠️ Embedding-Update fehlgeschlagen:", err)
    );

    return NextResponse.json(healthEntry, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Speichern der Gesundheitsdaten:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // 🔐 Authentifizierung prüfen
    const authResult = await authenticateRequest();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // 🔐 User kann nur eigene Daten abrufen
    const targetUserId = requestedUserId || authResult.userId!;
    if (requestedUserId && requestedUserId !== authResult.userId) {
      return NextResponse.json(
        { error: "Zugriff verweigert: Sie können nur eigene Daten abrufen" },
        { status: 403 }
      );
    }

    const conditions = [eq(healthData.userId, targetUserId)];
    if (from) conditions.push(gte(healthData.date, new Date(from)));
    if (to) conditions.push(lte(healthData.date, new Date(to)));

    const data = await db
      .select()
      .from(healthData)
      .where(and(...conditions))
      .orderBy(healthData.date)
      .limit(2000);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Fehler beim Abrufen der Gesundheitsdaten:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
