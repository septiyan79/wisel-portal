import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash("password123", 10)

  // ── Customer account ──────────────────────────────────────────
  await prisma.customer.upsert({
    where: { customerAccount: "W0001" },
    update: {},
    create: { customerAccount: "W0001", customerName: "PT Agro Nusantara" },
  })

  await prisma.user.upsert({
    where: { customerAccount: "W0001" },
    update: {},
    create: { customerAccount: "W0001", password: hashed, role: "customer" },
  })

  // ── Admin account ─────────────────────────────────────────────
  // Customer record tetap dibutuhkan karena FK constraint di User
  await prisma.customer.upsert({
    where: { customerAccount: "ADMIN" },
    update: {},
    create: { customerAccount: "ADMIN", customerName: "Administrator" },
  })

  await prisma.user.upsert({
    where: { customerAccount: "ADMIN" },
    update: {},
    create: { customerAccount: "ADMIN", password: hashed, role: "admin" },
  })

  console.log("Seed done:")
  console.log("  customer → W0001 / password123")
  console.log("  admin    → ADMIN / password123")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
