import { PrismaClient, Prisma } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof makePrisma> | undefined
}

function makePrisma() {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const MAX_RETRIES = 3
          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              return await query(args)
            } catch (e) {
              const isConnErr =
                e instanceof Prisma.PrismaClientInitializationError ||
                (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P1001")
              if (isConnErr && attempt < MAX_RETRIES) {
                await new Promise(r => setTimeout(r, attempt * 500))
                continue
              }
              throw e
            }
          }
        },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
