import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const transactionId = searchParams.get("transactionId")
  if (!transactionId) {
    return NextResponse.json({ error: "transactionId required" }, { status: 400 })
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { customerAccount: true, category: true },
  })
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }
  if (
    session.user.role === "customer" &&
    transaction.customerAccount !== session.user.customerAccount
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const assignments = await prisma.stockAssignment.findMany({
    where: { stockTransactionId: transactionId },
    include: { targetUnit: { select: { deviceNumber: true, fleetNumber: true, model: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(assignments)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { stockTransactionId, targetDeviceNumber, qty, note } = await req.json()

  if (!stockTransactionId || !targetDeviceNumber || qty == null) {
    return NextResponse.json({ error: "stockTransactionId, targetDeviceNumber, qty required" }, { status: 400 })
  }
  if (Number(qty) <= 0) {
    return NextResponse.json({ error: "qty must be > 0" }, { status: 400 })
  }
  if (targetDeviceNumber === "STOCK") {
    return NextResponse.json({ error: "Cannot assign to STOCK placeholder" }, { status: 400 })
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: stockTransactionId },
    include: { stockAssignments: { select: { qty: true } } },
  })
  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }
  if (transaction.category !== "S") {
    return NextResponse.json({ error: "Transaction is not a stock transaction" }, { status: 400 })
  }
  if (
    session.user.role === "customer" &&
    transaction.customerAccount !== session.user.customerAccount
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const assignedQty = transaction.stockAssignments.reduce((sum, a) => sum + a.qty, 0)
  const remaining = (transaction.qty ?? 0) - assignedQty
  if (Number(qty) > remaining) {
    return NextResponse.json(
      { error: `Qty exceeds remaining stock (${remaining})` },
      { status: 400 }
    )
  }

  const assignment = await prisma.stockAssignment.create({
    data: {
      stockTransactionId,
      targetDeviceNumber,
      qty: Number(qty),
      note: note || null,
    },
    include: { targetUnit: { select: { deviceNumber: true, fleetNumber: true, model: true } } },
  })

  return NextResponse.json(assignment, { status: 201 })
}
