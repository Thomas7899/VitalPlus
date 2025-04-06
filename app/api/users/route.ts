import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const { name, email } = await req.json();

  try {
    const user = await prisma.user.create({
      data: { name, email },
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const { id, name, email } = await req.json();

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { name, email },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Fehler beim Aktualisieren" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: "User gelöscht" });
  } catch {
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 400 });
  }
}
