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
      username: true,
      customerAccount: true,
      role: true,
      createdAt: true,
      customer: { select: { customerName: true } },
    },
  })

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
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
  const { username, customerAccount, password, role } = body

  if (!username || !customerAccount || !password || !role) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) return NextResponse.json({ error: "Username already exists" }, { status: 409 })

  if (role === "admin") {
    const existingAdmin = await prisma.user.findFirst({ where: { role: "admin" } })
    if (existingAdmin) {
      return NextResponse.json({ error: "Only one admin account is allowed" }, { status: 409 })
    }
  }

  // Customers are managed separately (Customer Management page) — a User can
  // only be created under an Account ID that already exists.
  const customer = await prisma.customer.findUnique({ where: { customerAccount } })
  if (!customer) {
    return NextResponse.json({ error: "Customer not found — create it on the Customers page first" }, { status: 404 })
  }

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { username, customerAccount, password: hashed, role },
  })

  return NextResponse.json({
    id: user.id,
    username: user.username,
    customerAccount: user.customerAccount,
    customerName: customer.customerName,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }, { status: 201 })
}
