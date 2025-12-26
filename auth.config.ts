// auth.config.ts
import type { NextAuthConfig } from "next-auth";

// Geschützte Routen (erfordern Login)
const protectedRoutes = [
  "/kalorien",
  "/blutdruck",
  "/user",
  "/vitalfunktionen",
  "/koerperzusammensetzung",
  "/regeneration",
];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      
      // Prüfe ob aktuelle Route geschützt ist
      const isProtectedRoute = protectedRoutes.some(route => 
        nextUrl.pathname.startsWith(route)
      );

      // Nicht eingeloggt + geschützte Route → Login
      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      // Eingeloggt + Login-Seite → Redirect zur Startseite
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;
