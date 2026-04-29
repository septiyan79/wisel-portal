import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import PartTransactionTable from "./PartTransactionTable"

export default async function TransactionByPartPage() {
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
      select: { partNumber: true, axPartNumber: true, partName: true, category: true, qty: true, totalPrice: true },
    }),
    prisma.stockAssignment.findMany({
      where: assignWhere,
      select: {
        qty: true,
        stockTransaction: { select: { partNumber: true, axPartNumber: true, partName: true, unitPrice: true } },
      },
    }),
  ])

  type Agg = {
    partName: string | null
    pmPrice: number
    pmQty: number
    repairPrice: number
    repairQty: number
    totalPrice: number
    totalQty: number
  }

  const groups = new Map<string, Agg>()
  let globalPMCount = 0, globalPMPrice = 0
  let globalRepairCount = 0, globalRepairPrice = 0
  let globalTotalPrice = 0

  for (const t of raw) {
    const key = t.partNumber || t.axPartNumber || "—"
    const price = t.totalPrice ?? 0
    const qty = t.qty ?? 0
    const isPM = t.category === "P"
    const isRepair = t.category === "R"

    const cur = groups.get(key) ?? { partName: t.partName ?? null, pmPrice: 0, pmQty: 0, repairPrice: 0, repairQty: 0, totalPrice: 0, totalQty: 0 }
    groups.set(key, {
      partName:    cur.partName ?? t.partName ?? null,
      pmPrice:     cur.pmPrice     + (isPM     ? price : 0),
      pmQty:       cur.pmQty       + (isPM     ? qty   : 0),
      repairPrice: cur.repairPrice + (isRepair ? price : 0),
      repairQty:   cur.repairQty   + (isRepair ? qty   : 0),
      totalPrice:  cur.totalPrice  + price,
      totalQty:    cur.totalQty    + qty,
    })

    if (isPM)     { globalPMCount++;     globalPMPrice     += price }
    if (isRepair) { globalRepairCount++; globalRepairPrice += price }
    globalTotalPrice += price
  }

  // Assignment rows dihitung sebagai Repair
  for (const a of rawAssignments) {
    const p = a.stockTransaction
    const key = p.partNumber || p.axPartNumber || "—"
    const price = p.unitPrice != null ? a.qty * p.unitPrice : 0
    const cur = groups.get(key) ?? { partName: p.partName ?? null, pmPrice: 0, pmQty: 0, repairPrice: 0, repairQty: 0, totalPrice: 0, totalQty: 0 }
    groups.set(key, {
      ...cur,
      partName:    cur.partName ?? p.partName ?? null,
      repairPrice: cur.repairPrice + price,
      repairQty:   cur.repairQty   + a.qty,
      totalPrice:  cur.totalPrice  + price,
      totalQty:    cur.totalQty    + a.qty,
    })
    globalRepairCount++
    globalRepairPrice += price
    globalTotalPrice  += price
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

      <PartTransactionTable
        parts={parts}
        pmCount={globalPMCount}
        pmPrice={globalPMPrice}
        repairCount={globalRepairCount}
        repairPrice={globalRepairPrice}
        totalCount={raw.length + rawAssignments.length}
        totalPrice={globalTotalPrice}
      />
    </>
  )
}
