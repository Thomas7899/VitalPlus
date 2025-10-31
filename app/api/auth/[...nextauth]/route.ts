import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
} = NextAuth({
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const creds = await z
          .object({
            email: z.string().email(),
            password: z.string(),
          })
          .safeParseAsync(credentials);

        if (!creds.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: creds.data.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(creds.data.password, user.password);

        return isValid ? user : null;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
  try {
    const newUrl = new URL(url, baseUrl);
    if (newUrl.origin === baseUrl) return newUrl.toString();
  } catch {
  }
  return baseUrl;
},

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
});
