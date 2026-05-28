import { prisma } from "@/lib/db"
import type { ReactNode } from "react"

function fmt(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

interface Props {
  role: string
  customerAccount?: string | null
  extraCard?: ReactNode
}

export async function TransactionKpiCards({ role, customerAccount, extraCard }: Props) {
  const customerFilter = role === "customer" && customerAccount ? { customerAccount } : {}

  const [raw, rawAssignments, rawStock] = await Promise.all([
    prisma.transaction.findMany({
      where: { isDeleted: false, NOT: { category: "S" }, ...customerFilter },
      select: { category: true, totalPrice: true },
    }),
    prisma.stockAssignment.findMany({
      where: { stockTransaction: { isDeleted: false, ...customerFilter } },
      select: { qty: true, category: true, stockTransaction: { select: { unitPrice: true } } },
    }),
    prisma.transaction.findMany({
      where: { isDeleted: false, category: "S", ...customerFilter },
      select: { qty: true, unitPrice: true, stockAssignments: { select: { qty: true } } },
    }),
  ])

  let totalPM = 0, totalPMPrice = 0
  let totalRepair = 0, totalRepairPrice = 0

  for (const t of raw) {
    if (t.category === "P") { totalPM++;     totalPMPrice     += t.totalPrice ?? 0 }
    if (t.category === "R") { totalRepair++; totalRepairPrice += t.totalPrice ?? 0 }
  }
  for (const a of rawAssignments) {
    const price = a.stockTransaction.unitPrice != null ? a.qty * a.stockTransaction.unitPrice : 0
    if (a.category === "P") { totalPM++;     totalPMPrice     += price }
    else                    { totalRepair++; totalRepairPrice += price }
  }

  let stockRemainingCount = 0, stockRemainingPrice = 0
  for (const s of rawStock) {
    const assignedQty = s.stockAssignments.reduce((sum, a) => sum + a.qty, 0)
    const remaining = (s.qty ?? 0) - assignedQty
    if (remaining > 0) {
      stockRemainingCount++
      stockRemainingPrice += remaining * (s.unitPrice ?? 0)
    }
  }

  const totalCount    = totalPM + totalRepair + stockRemainingCount
  const totalAllPrice = totalPMPrice + totalRepairPrice + stockRemainingPrice

  return (
    <div className={`grid grid-cols-2 gap-3 mb-5 ${extraCard ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
      {extraCard}
      <div className="bg-blue-50 rounded-xl p-4 border border-gray-100">
        <span className="inline-block text-[11px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mb-2">
          {totalPM.toLocaleString("id-ID")} tx
        </span>
        <p className="text-lg font-black text-blue-700 truncate">{fmt(totalPMPrice)}</p>
        <p className="text-xs text-gray-500 mt-0.5">PM Transactions</p>
      </div>

      <div className="bg-orange-50 rounded-xl p-4 border border-gray-100">
        <span className="inline-block text-[11px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mb-2">
          {totalRepair.toLocaleString("id-ID")} tx
        </span>
        <p className="text-lg font-black text-orange-600 truncate">{fmt(totalRepairPrice)}</p>
        <p className="text-xs text-gray-500 mt-0.5">Repair Transactions</p>
      </div>

      <div className="bg-green-50 rounded-xl p-4 border border-gray-100">
        <span className="inline-block text-[11px] font-bold bg-green-100 text-[#367C2B] px-2 py-0.5 rounded-full mb-2">
          {totalCount.toLocaleString("id-ID")} tx
        </span>
        <p className="text-lg font-black text-[#367C2B] truncate">{fmt(totalAllPrice)}</p>
        <p className="text-xs text-gray-500 mt-0.5">Total Transactions (PM, Repair and Stock)</p>
      </div>
    </div>
  )
}
