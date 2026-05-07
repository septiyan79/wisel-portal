import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { ApiKeysTab } from "@/components/dashboard/ApiKeysTab"

export default async function ApiKeysPage() {
  const session = await auth()
  if (session!.user.role === "customer") redirect("/dashboard")

  const [apiKeys, customers] = await Promise.all([
    prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        customerAccount: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
        customer: { select: { customerName: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { customerName: "asc" },
      select: { customerAccount: true, customerName: true },
    }),
  ])

  const keys = apiKeys.map((k) => ({
    id: k.id,
    label: k.label,
    customerAccount: k.customerAccount,
    customerName: k.customer.customerName,
    isActive: k.isActive,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
  }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">API Keys</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <ApiKeysTab initialKeys={keys} customers={customers} />
    </>
  )
}
