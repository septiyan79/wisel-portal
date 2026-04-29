"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, Eye } from "lucide-react"
import { StockDetailModal, type StockRow } from "./StockDetailModal"

interface StockTabProps {
  transactions: StockRow[]
  role: string
}

const PAGE_SIZE = 20

function fmt(n: number | null | undefined) {
  if (n == null) return "—"
  return n.toLocaleString("id-ID")
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function statusBadge(remaining: number, total: number | null) {
  if (total == null) return <span className="text-gray-400">—</span>
  if (remaining === 0)
    return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">Fully Assigned</span>
  if (remaining < total)
    return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">Partial</span>
  return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-500">Unassigned</span>
}

export function StockTab({ transactions: initialTransactions }: StockTabProps) {
  const [transactions, setTransactions] = useState<StockRow[]>(initialTransactions)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<StockRow | null>(null)

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase()
    return (
      !q ||
      t.soNumber?.toLowerCase().includes(q) ||
      t.partNumber?.toLowerCase().includes(q) ||
      t.axPartNumber?.toLowerCase().includes(q) ||
      t.partName?.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalQty = transactions.reduce((s, t) => s + (t.qty ?? 0), 0)
  const totalAssigned = transactions.reduce((s, t) => s + t.assignedQty, 0)
  const totalRemaining = totalQty - totalAssigned

  function handleChanged() {
    // Refresh: fetch ulang dari server tidak bisa di client component,
    // jadi kita trigger reload dengan router, atau user bisa refresh manual.
    // Sebagai alternatif, update local state dari assignment change melalui StockDetailModal's onChanged.
    // Di sini kita update assignedQty pada row yang berubah via refetch partial.
    if (!selected) return
    fetch(`/api/stock-assignments?transactionId=${selected.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return
        const newAssigned = data.reduce((s: number, a: { qty: number }) => s + a.qty, 0)
        setTransactions((prev) =>
          prev.map((t) => t.id === selected.id ? { ...t, assignedQty: newAssigned } : t)
        )
        setSelected((prev) => prev ? { ...prev, assignedQty: newAssigned } : prev)
      })
      .catch(() => {})
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Total Stock</p>
          <p className="text-2xl font-black text-gray-900 mt-0.5">{transactions.length}</p>
          <p className="text-xs text-gray-400">Part Number</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Assigned</p>
          <p className="text-2xl font-black text-[#367C2B] mt-0.5">{totalAssigned}</p>
          <p className="text-xs text-gray-400">Qty</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold uppercase">Remaining</p>
          <p className="text-2xl font-black text-amber-600 mt-0.5">{totalRemaining}</p>
          <p className="text-xs text-gray-400">Qty</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Cari SO Number, Part Number, Part Name..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#367C2B] focus:border-transparent"
        />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">SO Number</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">Part</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">Invoice Date</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">Assigned</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">Remaining</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 whitespace-nowrap">Total (Rp)</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    {search ? "Tidak ada hasil" : "Belum ada transaksi stock"}
                  </td>
                </tr>
              ) : (
                paginated.map((t) => {
                  const remaining = (t.qty ?? 0) - t.assignedQty
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{t.soNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-900 font-medium">{t.partName || "—"}</p>
                        <p className="text-xs text-gray-400">{t.partNumber || t.axPartNumber || ""}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(t.invoiceDate)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(t.qty)}</td>
                      <td className="px-4 py-3 text-right text-[#367C2B] font-semibold">{t.assignedQty}</td>
                      <td className="px-4 py-3 text-right text-amber-600 font-semibold">{remaining}</td>
                      <td className="px-4 py-3">{statusBadge(remaining, t.qty)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(t.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {filtered.length} hasil · halaman {safePage} / {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <StockDetailModal
          row={selected}
          onClose={() => setSelected(null)}
          onChanged={handleChanged}
        />
      )}
    </>
  )
}
