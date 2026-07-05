import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { exportToSheets } from "@/lib/gsheets"
import { validateUnitOwnership } from "@/lib/unit-validation"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { targetDeviceNumber, qty, category, check, packingSlipDate } = await req.json()

  const assignment = await prisma.stockAssignment.findUnique({
    where: { id },
    include: {
      stockTransaction: {
        include: { stockAssignments: { select: { qty: true, id: true } } },
      },
    },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }

  const tx = assignment.stockTransaction
  if (
    session.user.role === "customer" &&
    tx.customerAccount !== session.user.customerAccount
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (targetDeviceNumber === "STOCK") {
    return NextResponse.json({ error: "Cannot assign to STOCK placeholder" }, { status: 400 })
  }

  if (targetDeviceNumber !== undefined && tx.customerAccount) {
    const ownershipError = await validateUnitOwnership(targetDeviceNumber, tx.customerAccount)
    if (ownershipError) {
      return NextResponse.json({ error: ownershipError }, { status: 400 })
    }
  }

  if (qty != null) {
    if (Number(qty) <= 0) {
      return NextResponse.json({ error: "qty must be > 0" }, { status: 400 })
    }
    const otherAssigned = tx.stockAssignments
      .filter((a) => a.id !== id)
      .reduce((sum, a) => sum + a.qty, 0)
    const remaining = (tx.qty ?? 0) - otherAssigned
    if (Number(qty) > remaining) {
      return NextResponse.json(
        { error: `Qty exceeds remaining stock (${remaining})` },
        { status: 400 }
      )
    }
  }

  const updated = await prisma.stockAssignment.update({
    where: { id },
    data: {
      ...(targetDeviceNumber !== undefined && { targetDeviceNumber }),
      ...(qty != null && { qty: Number(qty) }),
      ...(category !== undefined && { category: category || null }),
      ...(check !== undefined && { check: check || null }),
      ...(packingSlipDate !== undefined && { packingSlipDate: packingSlipDate ? new Date(packingSlipDate) : null }),
    },
    include: { targetUnit: { select: { deviceNumber: true, fleetNumber: true, model: true } } },
  })

  void exportToSheets()
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const assignment = await prisma.stockAssignment.findUnique({
    where: { id },
    include: { stockTransaction: { select: { customerAccount: true } } },
  })
  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
  }
  if (
    session.user.role === "customer" &&
    assignment.stockTransaction.customerAccount !== session.user.customerAccount
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.stockAssignment.delete({ where: { id } })

  void exportToSheets()
  return NextResponse.json({ success: true })
}
