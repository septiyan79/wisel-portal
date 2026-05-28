import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import PartTransactionTable from "./PartTransactionTable"
import { TransactionKpiCards } from "@/components/dashboard/TransactionKpiCards"

export default async function TransactionByPartPage() {
  const session = await auth()
  const isCustomer = session!.user.role === "customer"
  const customerFilter = isCustomer ? { customerAccount: session!.user.customerAccount } : {}

  const [raw, rawStock] = await Promise.all([
    // P, R, O transactions
    prisma.transaction.findMany({
      where: { isDeleted: false, NOT: { category: "S" }, ...customerFilter },
      select: {
        partNumber: true,
        axPartNumber: true,
        partName: true,
        category: true,
        qty: true,
        totalPrice: true,
      },
    }),
    // Stock transactions with all their assignments
    prisma.transaction.findMany({
      where: { isDeleted: false, category: "S", ...customerFilter },
      select: {
        partNumber: true,
        axPartNumber: true,
        partName: true,
        qty: true,
        unitPrice: true,
        totalPrice: true,
        stockAssignments: { select: { qty: true } },
      },
    }),
  ])

  type Agg = {
    partName: string | null
    pmPrice: number
    repairPrice: number
    totalPrice: number
    totalQty: number
  }

  const groups = new Map<string, Agg>()
  // P / R / O transactions
  for (const t of raw) {
    const key = t.partNumber || t.axPartNumber || "—"
    const price = t.totalPrice ?? 0
    const qty = t.qty ?? 0
    const isPM = t.category === "P"
    const isRepair = t.category === "R"

    const cur = groups.get(key) ?? { partName: t.partName ?? null, pmPrice: 0, repairPrice: 0, totalPrice: 0, totalQty: 0 }
    groups.set(key, {
      partName:    cur.partName ?? t.partName ?? null,
      pmPrice:     cur.pmPrice     + (isPM     ? price : 0),
      repairPrice: cur.repairPrice + (isRepair ? price : 0),
      totalPrice:  cur.totalPrice  + price,
      totalQty:    cur.totalQty    + qty,
    })
  }

  // Stock transactions — qty = full stock qty (assigned + remaining)
  //                       price counted only for assigned portion
  for (const s of rawStock) {
    const key = s.partNumber || s.axPartNumber || "—"
    const stockQty = s.qty ?? 0
    const unitPrice = s.unitPrice ?? 0
    const assignedQty = s.stockAssignments.reduce((sum, a) => sum + a.qty, 0)
    const assignedPrice = assignedQty * unitPrice

    const cur = groups.get(key) ?? { partName: s.partName ?? null, pmPrice: 0, repairPrice: 0, totalPrice: 0, totalQty: 0 }
    groups.set(key, {
      partName:    cur.partName ?? s.partName ?? null,
      pmPrice:     cur.pmPrice,
      repairPrice: cur.repairPrice + assignedPrice,
      totalPrice:  cur.totalPrice  + assignedPrice,
      totalQty:    cur.totalQty    + stockQty,
    })
  }

  const parts = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([partNumber, agg]) => ({
      partNumber,
      partName: agg.partName,
      qty: agg.totalQty,
      pmPrice: agg.pmPrice,
      repairPrice: agg.repairPrice,
      totalPrice: agg.totalPrice,
    }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Transactions by Part Number</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>

      <TransactionKpiCards role={session!.user.role} customerAccount={session!.user.customerAccount} />

      <PartTransactionTable parts={parts} />
    </>
  )
}
