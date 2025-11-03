import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// 🧩 Zod-Schema zur Validierung
const userUpdateSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben.").optional(),
  email: z.string().email("Ungültige E-Mail-Adresse.").optional(),
  height: z.coerce.number().positive("Größe muss positiv sein.").optional().nullable(),
  weight: z.coerce.number().positive("Gewicht muss positiv sein.").optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

// 🔹 GET – Benutzerinformationen abrufen
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id !== session.user.id) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id!))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// 🔹 PUT – Benutzer aktualisieren
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await request.json();
  const parseResult = userUpdateSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabedaten", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const data = parseResult.data;

  // ✅ Typensichere Konvertierung
  const updateValues = {
    ...data,
    dateOfBirth: data.dateOfBirth
      ? new Date(data.dateOfBirth)
      : null,
  };

  const [updatedUser] = await db
    .update(users)
    .set(updateValues)
    .where(eq(users.id, session.user.id))
    .returning();

  return NextResponse.json(updatedUser);
}
