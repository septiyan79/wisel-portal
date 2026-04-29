import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { OrdersTab } from "@/components/dashboard/OrdersTab"

export default async function TransactionsPage() {
  const session = await auth()

  const txWhere =
    session!.user.role === "customer"
      ? { isDeleted: false, customerAccount: session!.user.customerAccount, NOT: { category: "S" } }
      : { isDeleted: false, NOT: { category: "S" } }

  const assignWhere =
    session!.user.role === "customer"
      ? { stockTransaction: { isDeleted: false, customerAccount: session!.user.customerAccount } }
      : { stockTransaction: { isDeleted: false } }

  const [raw, rawAssignments] = await Promise.all([
    prisma.transaction.findMany({
      where: txWhere,
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
    }),
    prisma.stockAssignment.findMany({
      where: assignWhere,
      include: {
        stockTransaction: {
          select: {
            soNumber: true,
            quotation: true,
            poNumber: true,
            partNumber: true,
            axPartNumber: true,
            partName: true,
            invoiceDate: true,
            packingSlipDate: true,
            unitPrice: true,
            customerAccount: true,
          },
        },
      },
    }),
  ])

  const transactions = raw.map((t) => ({
    ...t,
    invoiceDate:     t.invoiceDate?.toISOString()     ?? null,
    packingSlipDate: t.packingSlipDate?.toISOString() ?? null,
  }))

  const assignmentRows = rawAssignments.map((a) => {
    const p = a.stockTransaction
    return {
      id:              a.id,
      soNumber:        p.soNumber,
      quotation:       p.quotation,
      poNumber:        p.poNumber,
      partNumber:      p.partNumber,
      axPartNumber:    p.axPartNumber,
      partName:        p.partName,
      qty:             a.qty,
      category:        "R" as const,
      invoiceDate:     p.invoiceDate?.toISOString()     ?? null,
      packingSlipDate: p.packingSlipDate?.toISOString() ?? null,
      unitPrice:       p.unitPrice,
      totalPrice:      p.unitPrice != null ? a.qty * p.unitPrice : null,
      customerAccount: p.customerAccount,
      deviceNumber:    a.targetDeviceNumber,
      source:          "stock_assignment",
    }
  })

  const allTransactions = [...transactions, ...assignmentRows].sort((a, b) => {
    if (!a.invoiceDate && !b.invoiceDate) return 0
    if (!a.invoiceDate) return 1
    if (!b.invoiceDate) return -1
    return b.invoiceDate.localeCompare(a.invoiceDate)
  })

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Transactions</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <OrdersTab transactions={allTransactions} role={session!.user.role} />
    </>
  )
}
