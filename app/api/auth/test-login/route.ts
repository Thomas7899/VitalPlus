// app/api/auth/test-login/route.ts
// Diese Route ist nur für E2E-Tests gedacht und ermöglicht
// das Einloggen ohne CSRF-Token-Validierung

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { db } from "@/db/client";

// Diese Route nur in Entwicklung/Test aktivieren
const isTestEnvironment = process.env.NODE_ENV !== "production";

export async function POST(request: NextRequest) {
  if (!isTestEnvironment) {
    return NextResponse.json(
      { error: "Diese Route ist nur in Test-Umgebungen verfügbar" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email ist erforderlich" },
        { status: 400 }
      );
    }

    // Demo-User finden
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // JWT-Token erstellen (wie NextAuth es macht)
    const token = await encode({
      token: {
        sub: user.id,
        name: user.name,
        email: user.email,
      },
      secret: process.env.AUTH_SECRET!,
      salt: "authjs.session-token",
      maxAge: 30 * 24 * 60 * 60, // 30 Tage
    });

    // Session-Cookie setzen
    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === "production";
    const cookieName = isSecure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Test-Login Fehler:", error);
    return NextResponse.json(
      { error: "Login fehlgeschlagen" },
      { status: 500 }
    );
  }
}
