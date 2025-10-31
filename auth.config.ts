// auth.config.ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtectedRoute = nextUrl.pathname.startsWith("/kalorien");
      const isAuthPage = nextUrl.pathname.startsWith("/login");

      if (isProtectedRoute && !isLoggedIn) {
        return false;
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [], 
} satisfies NextAuthConfig;
