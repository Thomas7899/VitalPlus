import { auth } from "@/lib/auth"
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const userUpdateSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben.").optional(),
  email: z.string().email("Ungültige E-Mail-Adresse.").optional(),
  height: z.coerce.number().positive("Größe muss positiv sein.").optional().nullable(),
  weight: z.coerce.number().positive("Gewicht muss positiv sein.").optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
});

// GET-Handler zum Abrufen von Benutzerdaten
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

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(user);
}


export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const body = await request.json();
  const parseResult = userUpdateSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json({ error: "Ungültige Eingabedaten", details: parseResult.error.flatten() }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id }, // Update basiert auf der Session-ID, nicht auf der ID aus dem Body
    data: parseResult.data,
  });

  return NextResponse.json(updatedUser);
}
