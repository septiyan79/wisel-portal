import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const units = await prisma.unit.findMany({
    orderBy: { deviceNumber: "asc" },
    select: {
      id: true,
      deviceNumber: true,
      serialNumber: true,
      fleetNumber: true,
      model: true,
      createdAt: true,
    },
  })

  return NextResponse.json(units)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { deviceNumber, serialNumber, fleetNumber, model } = await req.json()

  if (!deviceNumber?.trim()) {
    return NextResponse.json({ error: "Device Number wajib diisi" }, { status: 400 })
  }

  const existing = await prisma.unit.findUnique({ where: { deviceNumber: deviceNumber.trim() } })
  if (existing) {
    return NextResponse.json({ error: "Device Number sudah terdaftar" }, { status: 409 })
  }

  const unit = await prisma.unit.create({
    data: {
      deviceNumber: deviceNumber.trim(),
      serialNumber: serialNumber?.trim() || null,
      fleetNumber:  fleetNumber?.trim()  || null,
      model:        model?.trim()        || null,
    },
  })

  return NextResponse.json(unit, { status: 201 })
}
