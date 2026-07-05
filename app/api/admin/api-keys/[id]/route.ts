import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const existing = await prisma.apiKey.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "API key not found" }, { status: 404 })

  await prisma.apiKey.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
