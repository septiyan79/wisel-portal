import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

function fmt(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
}

export default async function TransactionSummaryPage() {
  const session = await auth()

  const where =
    session!.user.role === "customer"
      ? { isDeleted: false, customerAccount: session!.user.customerAccount }
      : { isDeleted: false }

  const raw = await prisma.transaction.findMany({
    where,
    select: {
      totalPrice: true,
      qty: true,
      invoiceDate: true,
      partNumber: true,
      partName: true,
      deviceNumber: true,
    },
  })

  const totalValue = raw.reduce((sum, t) => sum + (t.totalPrice ?? 0), 0)
  const totalQty = raw.reduce((sum, t) => sum + (t.qty ?? 0), 0)
  const totalTx = raw.length

  // Monthly breakdown
  const monthMap = new Map<string, { count: number; value: number }>()
  for (const t of raw) {
    if (!t.invoiceDate) continue
    const key = t.invoiceDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })
    const cur = monthMap.get(key) ?? { count: 0, value: 0 }
    monthMap.set(key, { count: cur.count + 1, value: cur.value + (t.totalPrice ?? 0) })
  }
  const months = [...monthMap.entries()]
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 6)

  // Top 5 parts by total value
  const partMap = new Map<string, { name: string; value: number; count: number }>()
  for (const t of raw) {
    const key = t.partNumber || "—"
    const cur = partMap.get(key) ?? { name: t.partName || "—", value: 0, count: 0 }
    partMap.set(key, { ...cur, value: cur.value + (t.totalPrice ?? 0), count: cur.count + 1 })
  }
  const topParts = [...partMap.entries()]
    .sort(([, a], [, b]) => b.value - a.value)
    .slice(0, 5)

  // Top 5 fleets by total value
  const fleetMap = new Map<string, { value: number; count: number }>()
  for (const t of raw) {
    const key = t.deviceNumber || "—"
    const cur = fleetMap.get(key) ?? { value: 0, count: 0 }
    fleetMap.set(key, { value: cur.value + (t.totalPrice ?? 0), count: cur.count + 1 })
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Transactions</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{totalTx.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Qty</p>
          <p className="mt-1 text-2xl font-black text-gray-900">{totalQty.toLocaleString("id-ID")}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Value</p>
          <p className="mt-1 text-2xl font-black text-[#367C2B]">{fmt(totalValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly breakdown */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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

        {/* Top parts */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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

        {/* Top fleets */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
    </>
  )
}
