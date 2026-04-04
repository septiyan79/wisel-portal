import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash("password123", 10)

  // 1. Customer harus ada dulu (FK constraint)
  await prisma.customer.upsert({
    where: { customerAccount: "W0001" },
    update: {},
    create: {
      customerAccount: "W0001",
      customerName: "PT Agro Nusantara",
    },
  })

  // 2. Baru buat User yang merujuk ke Customer
  await prisma.user.upsert({
    where: { customerAccount: "W0001" },
    update: {},
    create: {
      customerAccount: "W0001",
      password: hashed,
      role: "customer",
    },
  })

  console.log("Seed done: W0001 / password123")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
