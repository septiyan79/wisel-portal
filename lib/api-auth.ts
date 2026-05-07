import { prisma } from "@/lib/db"

export async function getCustomerFromApiKey(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer wsl_")) return null
  const key = authHeader.slice(7).trim()

  const apiKey = await prisma.apiKey.findUnique({
    where: { key, isActive: true },
    select: { customerAccount: true },
  })
  if (!apiKey) return null

  void prisma.apiKey.update({ where: { key }, data: { lastUsedAt: new Date() } })

  return apiKey.customerAccount
}
