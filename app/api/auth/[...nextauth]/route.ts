import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
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
          .safeParseAsync(credentials)

        if (!creds.success) return null

        const user = await prisma.user.findUnique({
          where: { email: creds.data.email },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(creds.data.password, user.password)
        if (!isValid) return null

        return user
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
}

export const { handlers, auth } = NextAuth(authConfig)
export const { GET, POST } = handlers
