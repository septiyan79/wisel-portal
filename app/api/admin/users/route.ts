import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerAccount: true,
      role: true,
      createdAt: true,
      customer: { select: { customerName: true } },
    },
  })

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      customerAccount: u.customerAccount,
      customerName: u.customer?.customerName ?? "",
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }))
  )
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { customerAccount, customerName, password, role } = body

  if (!customerAccount || !customerName || !password || !role) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { customerAccount } })
  if (existing) return NextResponse.json({ error: "Account ID already exists" }, { status: 409 })

  const hashed = await bcrypt.hash(password, 10)

  const [customer, user] = await prisma.$transaction([
    prisma.customer.upsert({
      where: { customerAccount },
      update: { customerName },
      create: { customerAccount, customerName },
    }),
    prisma.user.create({
      data: { customerAccount, password: hashed, role },
    }),
  ])

  return NextResponse.json({
    id: user.id,
    customerAccount: user.customerAccount,
    customerName: customer.customerName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }, { status: 201 })
}
