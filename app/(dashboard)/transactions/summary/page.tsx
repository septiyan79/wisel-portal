import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { OrdersTab } from "@/components/dashboard/OrdersTab"

function fmt(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export default async function TransactionSummaryPage() {
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
        id: true, soNumber: true, quotation: true, poNumber: true,
        partNumber: true, axPartNumber: true, partName: true,
        qty: true, category: true, invoiceDate: true, packingSlipDate: true,
        unitPrice: true, totalPrice: true, check: true,
        customerAccount: true, deviceNumber: true, source: true,
      },
    }),
    prisma.stockAssignment.findMany({
      where: assignWhere,
      include: {
        stockTransaction: {
          select: {
            soNumber: true, quotation: true, poNumber: true,
            partNumber: true, axPartNumber: true, partName: true,
            invoiceDate: true, packingSlipDate: true,
            unitPrice: true, customerAccount: true,
          },
        },
      },
    }),
  ])

  // ── Table rows ────────────────────────────────────────────────
  const transactions = raw.map((t) => ({
    ...t,
    invoiceDate:     t.invoiceDate?.toISOString()     ?? null,
    packingSlipDate: t.packingSlipDate?.toISOString() ?? null,
    check:           t.check ?? null,
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
      packingSlipDate: a.packingSlipDate?.toISOString() ?? null,
      unitPrice:       p.unitPrice,
      totalPrice:      p.unitPrice != null ? a.qty * p.unitPrice : null,
      check:           a.check ?? null,
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

  // ── KPI ───────────────────────────────────────────────────────
  let totalPM = 0, totalPMPrice = 0
  let totalRepair = 0, totalRepairPrice = 0
  let totalAllPrice = 0

  for (const t of raw) {
    if (t.category === "P") { totalPM++;     totalPMPrice     += t.totalPrice ?? 0 }
    if (t.category === "R") { totalRepair++; totalRepairPrice += t.totalPrice ?? 0 }
    totalAllPrice += t.totalPrice ?? 0
  }
  for (const a of rawAssignments) {
    const price = a.stockTransaction.unitPrice != null ? a.qty * a.stockTransaction.unitPrice : 0
    totalRepair++
    totalRepairPrice += price
    totalAllPrice    += price
  }
  const totalCount = raw.length + rawAssignments.length

  // ── Value by Month ────────────────────────────────────────────
  const monthMap = new Map<string, { count: number; value: number }>()
  for (const t of raw) {
    if (!t.invoiceDate) continue
    const key = t.invoiceDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    const cur = monthMap.get(key) ?? { count: 0, value: 0 }
    monthMap.set(key, { count: cur.count + 1, value: cur.value + (t.totalPrice ?? 0) })
  }
  for (const a of rawAssignments) {
    const date = a.stockTransaction.invoiceDate
    if (!date) continue
    const key = date.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    const price = a.stockTransaction.unitPrice != null ? a.qty * a.stockTransaction.unitPrice : 0
    const cur = monthMap.get(key) ?? { count: 0, value: 0 }
    monthMap.set(key, { count: cur.count + 1, value: cur.value + price })
  }
  const months = [...monthMap.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)

  // ── Top 5 Part Number ─────────────────────────────────────────
  const partMap = new Map<string, { name: string; value: number; count: number }>()
  for (const t of raw) {
    const key = t.partNumber || "—"
    const cur = partMap.get(key) ?? { name: t.partName || "—", value: 0, count: 0 }
    partMap.set(key, { ...cur, value: cur.value + (t.totalPrice ?? 0), count: cur.count + 1 })
  }
  for (const a of rawAssignments) {
    const key = a.stockTransaction.partNumber || "—"
    const price = a.stockTransaction.unitPrice != null ? a.qty * a.stockTransaction.unitPrice : 0
    const cur = partMap.get(key) ?? { name: a.stockTransaction.partName || "—", value: 0, count: 0 }
    partMap.set(key, { ...cur, value: cur.value + price, count: cur.count + 1 })
  }
  const topParts = [...partMap.entries()]
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 5)

  // ── Top 5 Fleet Number ────────────────────────────────────────
  const fleetMap = new Map<string, { value: number; count: number }>()
  for (const t of raw) {
    const key = t.deviceNumber || "—"
    const cur = fleetMap.get(key) ?? { value: 0, count: 0 }
    fleetMap.set(key, { value: cur.value + (t.totalPrice ?? 0), count: cur.count + 1 })
  }
  for (const a of rawAssignments) {
    const key = a.targetDeviceNumber
    const price = a.stockTransaction.unitPrice != null ? a.qty * a.stockTransaction.unitPrice : 0
    const cur = fleetMap.get(key) ?? { value: 0, count: 0 }
    fleetMap.set(key, { value: cur.value + price, count: cur.count + 1 })
  }
  const topFleets = [...fleetMap.entries()]
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 5)

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Transaction Summary</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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
          <p className="text-xs text-gray-500 mt-0.5">Total Transactions</p>
        </div>
      </div>

      {/* 3 data cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

        {/* Value by Month */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-black text-gray-900">Value by Month</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {months.length === 0 && (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">No data.</p>
            )}
            {months.map(([month, data]) => (
              <div key={month} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{month}</p>
                  <p className="text-xs text-gray-500">{data.count} transactions</p>
                </div>
                <p className="text-sm font-bold text-[#367C2B]">{fmt(data.value)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Part Number */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-black text-gray-900">Top 5 Part Number</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topParts.length === 0 && (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">No data.</p>
            )}
            {topParts.map(([partNumber, data], i) => (
              <div key={partNumber} className="px-4 py-3 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#367C2B]/10 text-[#367C2B] text-[11px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold font-mono text-gray-900 truncate">{partNumber}</p>
                  <p className="text-xs text-gray-500 truncate">{data.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-[#367C2B]">{fmt(data.value)}</p>
                  <p className="text-[11px] text-gray-400">{data.count}x</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Fleet Number */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-black text-gray-900">Top 5 Fleet Number</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {topFleets.length === 0 && (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">No data.</p>
            )}
            {topFleets.map(([fleet, data], i) => (
              <div key={fleet} className="px-4 py-3 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#367C2B]/10 text-[#367C2B] text-[11px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold font-mono text-gray-900 truncate">{fleet}</p>
                  <p className="text-xs text-gray-500">{data.count} transactions</p>
                </div>
                <p className="text-xs font-bold text-[#367C2B] shrink-0">{fmt(data.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <OrdersTab transactions={allTransactions} role={session!.user.role} />
    </>
  )
}
