import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import PartTransactionTable from "./PartTransactionTable"

export default async function TransactionByPartPage() {
  const session = await auth()

  const where =
    session!.user.role === "customer"
      ? { isDeleted: false, customerAccount: session!.user.customerAccount }
      : { isDeleted: false }

  const raw = await prisma.transaction.findMany({
    where,
    select: {
      partNumber: true,
      axPartNumber: true,
      partName: true,
      category: true,
      qty: true,
      totalPrice: true,
    },
  })

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

    const cur = groups.get(key) ?? {
      partName: t.partName ?? null,
      pmPrice: 0, pmQty: 0,
      repairPrice: 0, repairQty: 0,
      totalPrice: 0, totalQty: 0,
    }
    groups.set(key, {
      partName: cur.partName ?? t.partName ?? null,
      pmPrice:    cur.pmPrice    + (isPM     ? price : 0),
      pmQty:      cur.pmQty      + (isPM     ? qty   : 0),
      repairPrice: cur.repairPrice + (isRepair ? price : 0),
      repairQty:   cur.repairQty   + (isRepair ? qty   : 0),
      totalPrice:  cur.totalPrice  + price,
      totalQty:    cur.totalQty    + qty,
    })

    if (isPM)     { globalPMCount++;     globalPMPrice     += price }
    if (isRepair) { globalRepairCount++; globalRepairPrice += price }
    globalTotalPrice += price
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
        totalCount={raw.length}
        totalPrice={globalTotalPrice}
      />
    </>
  )
}
