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
  const { password, role } = body

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (user.role === "admin" && role && role !== "admin") {
    return NextResponse.json({ error: "The admin account's role cannot be changed" }, { status: 400 })
  }

  if (role === "admin" && user.role !== "admin") {
    const existingAdmin = await prisma.user.findFirst({ where: { role: "admin", NOT: { id } } })
    if (existingAdmin) {
      return NextResponse.json({ error: "Only one admin account is allowed" }, { status: 409 })
    }
  }

  const userUpdate: Record<string, string> = {}
  if (role) userUpdate.role = role
  if (password) userUpdate.password = await bcrypt.hash(password, 10)

  if (Object.keys(userUpdate).length) {
    await prisma.user.update({ where: { id }, data: userUpdate })
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      customerAccount: true,
      role: true,
      createdAt: true,
      customer: { select: { customerName: true } },
    },
  })

  return NextResponse.json({
    id: updated!.id,
    username: updated!.username,
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

  if (user.role === "admin") {
    return NextResponse.json({ error: "Admin accounts cannot be deleted" }, { status: 400 })
  }

  if (user.id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
