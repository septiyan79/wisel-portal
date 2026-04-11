import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const unit = await prisma.unit.findUnique({ where: { id } })
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { deviceNumber, serialNumber, fleetNumber, model } = await req.json()

  if (!deviceNumber?.trim()) {
    return NextResponse.json({ error: "Device Number wajib diisi" }, { status: 400 })
  }

  // Cek duplikasi deviceNumber jika diubah
  if (deviceNumber.trim() !== unit.deviceNumber) {
    const conflict = await prisma.unit.findUnique({ where: { deviceNumber: deviceNumber.trim() } })
    if (conflict) return NextResponse.json({ error: "Device Number sudah digunakan" }, { status: 409 })
  }

  const updated = await prisma.unit.update({
    where: { id },
    data: {
      deviceNumber: deviceNumber.trim(),
      serialNumber: serialNumber?.trim() || null,
      fleetNumber:  fleetNumber?.trim()  || null,
      model:        model?.trim()        || null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  })
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (unit._count.transactions > 0) {
    return NextResponse.json(
      { error: `Unit tidak dapat dihapus karena terhubung ke ${unit._count.transactions} transaksi` },
      { status: 409 }
    )
  }

  await prisma.unit.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
