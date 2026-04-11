import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const customers = await prisma.customer.findMany({
    orderBy: { customerName: "asc" },
    select: { customerAccount: true, customerName: true },
  })

  return NextResponse.json(customers)
}
