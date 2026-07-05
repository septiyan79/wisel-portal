import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { customerName } = await req.json()

  if (!customerName?.trim()) {
    return NextResponse.json({ error: "Company Name is required" }, { status: 400 })
  }

  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  const customer = await prisma.customer.update({
    where: { id },
    data: { customerName: customerName.trim() },
    select: {
      id: true,
      customerAccount: true,
      customerName: true,
      createdAt: true,
      _count: { select: { users: true, units: true, transactions: true, apiKeys: true } },
    },
  })

  return NextResponse.json({
    id: customer.id,
    customerAccount: customer.customerAccount,
    customerName: customer.customerName,
    createdAt: customer.createdAt.toISOString(),
    userCount: customer._count.users,
    unitCount: customer._count.units,
    transactionCount: customer._count.transactions,
    apiKeyCount: customer._count.apiKeys,
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      customerAccount: true,
      _count: { select: { users: true, units: true, transactions: true, apiKeys: true } },
    },
  })
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  const blockers: string[] = []
  if (customer._count.users > 0) blockers.push(`${customer._count.users} user(s)`)
  if (customer._count.units > 0) blockers.push(`${customer._count.units} unit(s)`)
  if (customer._count.transactions > 0) blockers.push(`${customer._count.transactions} transaction(s)`)
  if (customer._count.apiKeys > 0) blockers.push(`${customer._count.apiKeys} API key(s)`)

  if (blockers.length > 0) {
    return NextResponse.json(
      { error: `Cannot delete: this customer still has ${blockers.join(", ")} linked to it.` },
      { status: 409 }
    )
  }

  await prisma.customer.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
