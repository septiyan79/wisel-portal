import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function getManualTransaction(id: string, customerAccount: string, role: string) {
  const tx = await prisma.transaction.findUnique({ where: { id } })
  if (!tx || tx.isDeleted) return null
  if (tx.source !== "manual") return null
  if (role === "customer" && tx.customerAccount !== customerAccount) return null
  return tx
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const tx = await getManualTransaction(id, session.user.customerAccount, session.user.role)
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const {
    soNumber, quotation, poNumber, partNumber, axPartNumber, partName,
    qty, datePackingSlip, unitPrice, totalPrice, deviceNumber,
  } = body

  if (deviceNumber) {
    await prisma.unit.upsert({
      where: { deviceNumber },
      update: {},
      create: { deviceNumber },
    })
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      soNumber:        soNumber        ?? null,
      quotation:       quotation       ?? null,
      poNumber:        poNumber        ?? null,
      partNumber:      partNumber      ?? null,
      axPartNumber:    axPartNumber    ?? null,
      partName:        partName        ?? null,
      qty:             qty != null ? Number(qty) : null,
      datePackingSlip: datePackingSlip ? new Date(datePackingSlip) : null,
      unitPrice:       unitPrice  != null ? Number(unitPrice)  : null,
      totalPrice:      totalPrice != null ? Number(totalPrice) : null,
      deviceNumber:    deviceNumber    || null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const tx = await getManualTransaction(id, session.user.customerAccount, session.user.role)
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.transaction.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
