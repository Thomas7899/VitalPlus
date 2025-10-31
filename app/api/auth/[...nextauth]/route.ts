import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { auth } from "@/lib/auth"

const { handlers } = NextAuth(authConfig)

export const { GET, POST } = handlers
export { auth };