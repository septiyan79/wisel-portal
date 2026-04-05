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

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    soNumber, quotation, poNumber, partNumber, axPartNumber, partName,
    qty, datePackingSlip, unitPrice, totalPrice, deviceNumber,
  } = body

  // Jika ada deviceNumber, upsert Unit agar FK tidak gagal
  if (deviceNumber) {
    await prisma.unit.upsert({
      where: { deviceNumber },
      update: {},
      create: { deviceNumber },
    })
  }

  const transaction = await prisma.transaction.create({
    data: {
      source: "manual",
      customerAccount: session.user.customerAccount,
      soNumber:        soNumber        || null,
      quotation:       quotation       || null,
      poNumber:        poNumber        || null,
      partNumber:      partNumber      || null,
      axPartNumber:    axPartNumber    || null,
      partName:        partName        || null,
      qty:             qty != null ? Number(qty) : null,
      datePackingSlip: datePackingSlip ? new Date(datePackingSlip) : null,
      unitPrice:       unitPrice  != null ? Number(unitPrice)  : null,
      totalPrice:      totalPrice != null ? Number(totalPrice) : null,
      deviceNumber:    deviceNumber    || null,
    },
  })

  return NextResponse.json(transaction, { status: 201 })
}
