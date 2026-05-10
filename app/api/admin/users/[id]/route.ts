import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { customerName, password, role } = body

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const userUpdate: Record<string, string> = {}
  if (role) userUpdate.role = role
  if (password) userUpdate.password = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    ...(Object.keys(userUpdate).length
      ? [prisma.user.update({ where: { id }, data: userUpdate })]
      : []),
    ...(customerName
      ? [prisma.customer.update({ where: { customerAccount: user.customerAccount }, data: { customerName } })]
      : []),
  ])

  const updated = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      customerAccount: true,
      role: true,
      createdAt: true,
      customer: { select: { customerName: true } },
    },
  })

  return NextResponse.json({
    id: updated!.id,
    customerAccount: updated!.customerAccount,
    customerName: updated!.customer?.customerName ?? "",
    role: updated!.role,
    createdAt: updated!.createdAt.toISOString(),
  })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (user.customerAccount === session.user.customerAccount) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
