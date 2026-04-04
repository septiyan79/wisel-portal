import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash("password123", 10)
  await prisma.user.upsert({
    where: { customerAccount: "W0001" },
    update: {},
    create: {
      customerAccount: "W0001",
      email: "user@wisel.co.id",
      password: hashed,
      role: "customer",
    },
  })
  console.log("Seed done.")
}

main().then(() => prisma.$disconnect())
