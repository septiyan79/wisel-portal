import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

function fmt(value: number | null) {
  if (value == null) return "—"
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
}

function fmtDate(date: Date | null) {
  if (!date) return "—"
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

export default async function TransactionByPartPage() {
  const session = await auth()

  const where =
    session!.user.role === "customer"
      ? { isDeleted: false, customerAccount: session!.user.customerAccount }
      : { isDeleted: false }

  const raw = await prisma.transaction.findMany({
    where,
    orderBy: [{ partNumber: "asc" }, { invoiceDate: "desc" }],
    select: {
      id: true,
      soNumber: true,
      partNumber: true,
      axPartNumber: true,
      partName: true,
      qty: true,
      invoiceDate: true,
      unitPrice: true,
      totalPrice: true,
      deviceNumber: true,
    },
  })

  const groups = new Map<string, typeof raw>()
  for (const t of raw) {
    const key = t.partNumber || t.axPartNumber || "—"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(t)
  }
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Transactions by Part Number</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {sortedGroups.length} part numbers found &middot; {raw.length} total transactions
      </p>

      <div className="space-y-3">
        {sortedGroups.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-6 py-12 text-center text-sm text-gray-400">
            No transaction data.
          </div>
        )}
        {sortedGroups.map(([partKey, items]) => {
          const totalQty = items.reduce((sum, t) => sum + (t.qty ?? 0), 0)
          const totalValue = items.reduce((sum, t) => sum + (t.totalPrice ?? 0), 0)
          const partName = items.find((t) => t.partName)?.partName || "—"
          return (
            <details key={partKey} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-gray-50 transition-colors list-none">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black font-mono text-gray-900">{partKey}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">
                      {items.length} transactions
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{partName}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-[#367C2B]">{fmt(totalValue)}</p>
                  <p className="text-xs text-gray-500">Total Qty: {totalQty}</p>
                </div>
              </summary>

              <div className="border-t border-gray-100 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide text-[11px]">
                      <th className="px-4 py-2 text-left font-semibold">SO Number</th>
                      <th className="px-4 py-2 text-left font-semibold">Fleet Number</th>
                      <th className="px-4 py-2 text-right font-semibold">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold">Unit Price</th>
                      <th className="px-4 py-2 text-right font-semibold">Total</th>
                      <th className="px-4 py-2 text-right font-semibold">Invoice Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-gray-700">{t.soNumber || "—"}</td>
                        <td className="px-4 py-2 font-mono text-gray-700">{t.deviceNumber || "—"}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{t.qty ?? "—"}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{fmt(t.unitPrice)}</td>
                        <td className="px-4 py-2 text-right font-semibold text-gray-900">{fmt(t.totalPrice)}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{fmtDate(t.invoiceDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )
        })}
      </div>
    </>
  )
}
