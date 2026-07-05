import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const unit = await prisma.unit.findUnique({ where: { id } })
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (unit.deviceNumber === "WSL-000039232") {
    return NextResponse.json({ error: "Unit ini tidak dapat diubah karena digunakan sebagai unit stock sistem" }, { status: 403 })
  }

  const { deviceNumber, serialNumber, fleetNumber, model, customerAccount } = await req.json()

  if (!deviceNumber?.trim()) {
    return NextResponse.json({ error: "Device Number wajib diisi" }, { status: 400 })
  }
  if (!customerAccount?.trim()) {
    return NextResponse.json({ error: "Customer wajib diisi" }, { status: 400 })
  }

  // Cek duplikasi deviceNumber jika diubah
  if (deviceNumber.trim() !== unit.deviceNumber) {
    const conflict = await prisma.unit.findUnique({ where: { deviceNumber: deviceNumber.trim() } })
    if (conflict) return NextResponse.json({ error: "Device Number sudah digunakan" }, { status: 409 })
  }

  const customer = await prisma.customer.findUnique({ where: { customerAccount: customerAccount.trim() } })
  if (!customer) {
    return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 })
  }

  const updated = await prisma.unit.update({
    where: { id },
    data: {
      deviceNumber:    deviceNumber.trim(),
      serialNumber:    serialNumber?.trim()    || null,
      fleetNumber:     fleetNumber?.trim()     || null,
      model:           model?.trim()           || null,
      customerAccount: customerAccount.trim(),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { _count: { select: { transactions: true } } },
  })
  if (!unit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (unit.deviceNumber === "WSL-000039232") {
    return NextResponse.json({ error: "Unit ini tidak dapat dihapus karena digunakan sebagai unit stock sistem" }, { status: 403 })
  }

  if (unit._count.transactions > 0) {
    return NextResponse.json(
      { error: `Unit tidak dapat dihapus karena terhubung ke ${unit._count.transactions} transaksi` },
      { status: 409 }
    )
  }

  await prisma.unit.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
