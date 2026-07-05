import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        const customer = await prisma.customer.findUnique({
          where: { customerAccount: user.customerAccount },
          select: { customerName: true },
        })

        return { ...user, customerName: customer?.customerName ?? user.customerAccount }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string
          username: string
          role: string
          customerAccount: string
          customerName?: string
        }
        token.id = u.id
        token.username = u.username
        token.role = u.role
        token.customerAccount = u.customerAccount
        token.customerName = u.customerName ?? u.customerAccount
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.username = token.username
      session.user.role = token.role
      session.user.customerAccount = token.customerAccount
      session.user.customerName = token.customerName ?? token.customerAccount ?? ""
      return session
    },
  },
})
