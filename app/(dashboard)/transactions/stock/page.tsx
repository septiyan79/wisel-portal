import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { StockTab } from "@/components/dashboard/StockTab"

export default async function StockPage() {
  const session = await auth()

  const where =
    session!.user.role === "customer"
      ? { isDeleted: false, category: "S", customerAccount: session!.user.customerAccount }
      : { isDeleted: false, category: "S" }

  const raw = await prisma.transaction.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    select: {
      id: true,
      soNumber: true,
      partNumber: true,
      axPartNumber: true,
      partName: true,
      qty: true,
      invoiceDate: true,
      packingSlipDate: true,
      unitPrice: true,
      totalPrice: true,
      customerAccount: true,
      stockAssignments: { select: { qty: true } },
    },
  })

  const transactions = raw.map((t) => ({
    id: t.id,
    soNumber: t.soNumber,
    partNumber: t.partNumber,
    axPartNumber: t.axPartNumber,
    partName: t.partName,
    qty: t.qty,
    invoiceDate: t.invoiceDate?.toISOString() ?? null,
    packingSlipDate: t.packingSlipDate?.toISOString() ?? null,
    unitPrice: t.unitPrice,
    totalPrice: t.totalPrice,
    customerAccount: t.customerAccount,
    assignedQty: t.stockAssignments.reduce((s, a) => s + a.qty, 0),
  }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Stock Transactions</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <StockTab transactions={transactions} role={session!.user.role} />
    </>
  )
}
