import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { CustomersTab } from "@/components/dashboard/CustomersTab"

export default async function CustomersPage() {
  const session = await auth()
  if (session!.user.role !== "admin") redirect("/dashboard")

  const raw = await prisma.customer.findMany({
    orderBy: { customerName: "asc" },
    select: {
      id: true,
      customerAccount: true,
      customerName: true,
      createdAt: true,
      _count: { select: { users: true, units: true, transactions: true, apiKeys: true } },
    },
  })

  const customers = raw.map((c) => ({
    id: c.id,
    customerAccount: c.customerAccount,
    customerName: c.customerName,
    createdAt: c.createdAt.toISOString(),
    userCount: c._count.users,
    unitCount: c._count.units,
    transactionCount: c._count.transactions,
    apiKeyCount: c._count.apiKeys,
  }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Customer Management</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <CustomersTab initialCustomers={customers} />
    </>
  )
}
