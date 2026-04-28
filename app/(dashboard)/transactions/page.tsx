import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { OrdersTab } from "@/components/dashboard/OrdersTab"

export default async function TransactionsPage() {
  const session = await auth()

  const where =
    session!.user.role === "customer"
      ? { isDeleted: false, customerAccount: session!.user.customerAccount, NOT: { category: "S" } }
      : { isDeleted: false, NOT: { category: "S" } }

  const raw = await prisma.transaction.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    select: {
      id: true,
      soNumber: true,
      quotation: true,
      poNumber: true,
      partNumber: true,
      axPartNumber: true,
      partName: true,
      qty: true,
      category: true,
      invoiceDate: true,
      packingSlipDate: true,
      unitPrice: true,
      totalPrice: true,
      customerAccount: true,
      deviceNumber: true,
      source: true,
    },
  })

  const transactions = raw.map((t) => ({
    ...t,
    invoiceDate:     t.invoiceDate?.toISOString()     ?? null,
    packingSlipDate: t.packingSlipDate?.toISOString() ?? null,
  }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Transactions</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <OrdersTab transactions={transactions} role={session!.user.role} />
    </>
  )
}
