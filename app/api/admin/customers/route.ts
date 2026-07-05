import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const customers = await prisma.customer.findMany({
    orderBy: { customerName: "asc" },
    select: {
      id: true,
      customerAccount: true,
      customerName: true,
      createdAt: true,
      _count: { select: { users: true, units: true, transactions: true, apiKeys: true } },
    },
  })

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      customerAccount: c.customerAccount,
      customerName: c.customerName,
      createdAt: c.createdAt.toISOString(),
      userCount: c._count.users,
      unitCount: c._count.units,
      transactionCount: c._count.transactions,
      apiKeyCount: c._count.apiKeys,
    }))
  )
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { customerAccount, customerName } = await req.json()

  if (!customerAccount?.trim() || !customerName?.trim()) {
    return NextResponse.json({ error: "Account ID and Company Name are required" }, { status: 400 })
  }

  const existing = await prisma.customer.findUnique({ where: { customerAccount: customerAccount.trim() } })
  if (existing) return NextResponse.json({ error: "Account ID already exists" }, { status: 409 })

  const customer = await prisma.customer.create({
    data: { customerAccount: customerAccount.trim(), customerName: customerName.trim() },
  })

  return NextResponse.json({
    id: customer.id,
    customerAccount: customer.customerAccount,
    customerName: customer.customerName,
    createdAt: customer.createdAt.toISOString(),
    userCount: 0,
    unitCount: 0,
    transactionCount: 0,
    apiKeyCount: 0,
  }, { status: 201 })
}
