import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { randomBytes } from "crypto"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      customerAccount: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
      customer: { select: { customerName: true } },
    },
  })

  return NextResponse.json(keys)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { customerAccount, label } = await req.json()
  if (!customerAccount || !label) {
    return NextResponse.json({ error: "customerAccount and label are required" }, { status: 400 })
  }

  const customer = await prisma.customer.findUnique({ where: { customerAccount } })
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  const key = "wsl_" + randomBytes(32).toString("hex")

  const apiKey = await prisma.apiKey.create({
    data: { key, label, customerAccount },
    select: { id: true, key: true, label: true, customerAccount: true, createdAt: true },
  })

  return NextResponse.json(apiKey, { status: 201 })
}
