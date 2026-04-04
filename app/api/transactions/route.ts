import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const where =
    session.user.role === "customer"
      ? { isDeleted: false, customerAccount: session.user.customerAccount }
      : { isDeleted: false }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { datePackingSlip: "desc" },
    select: {
      id: true,
      soNumber: true,
      partNumber: true,
      axPartNumber: true,
      partName: true,
      qty: true,
      datePackingSlip: true,
      unitPrice: true,
      totalPrice: true,
      customerAccount: true,
      deviceNumber: true,
      source: true,
    },
  })

  return NextResponse.json(transactions)
}
