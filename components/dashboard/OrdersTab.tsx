"use client"

import { useState } from "react"
import { Package, Eye } from "lucide-react"
import { OrderDetailModal } from "./OrderDetailModal"

export type TransactionRow = {
  id: string
  soNumber: string | null
  partNumber: string | null
  axPartNumber: string | null
  partName: string | null
  qty: number | null
  datePackingSlip: string | null
  unitPrice: number | null
  totalPrice: number | null
  customerAccount: string | null
  deviceNumber: string | null
  source: string
}

interface OrdersTabProps {
  transactions: TransactionRow[]
}

function fmt(value: number | null | undefined) {
  if (value == null) return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function OrdersTab({ transactions }: OrdersTabProps) {
  const [selected, setSelected] = useState<TransactionRow | null>(null)
  const [search, setSearch] = useState("")

  const filtered = transactions.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.soNumber?.toLowerCase().includes(q) ||
      t.partName?.toLowerCase().includes(q) ||
      t.partNumber?.toLowerCase().includes(q) ||
      t.deviceNumber?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {selected && (
        <OrderDetailModal transaction={selected} onClose={() => setSelected(null)} />
      )}

      {/* Stat ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Transaksi", value: transactions.length,                              color: "text-gray-900",  bg: "bg-gray-50" },
          { label: "Bulan Ini",       value: transactions.filter((t) => {
            if (!t.datePackingSlip) return false
            const d = new Date(t.datePackingSlip)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length, color: "text-green-700", bg: "bg-green-50" },
          { label: "Total Nilai",     value: fmt(transactions.reduce((s, t) => s + (t.totalPrice ?? 0), 0)), color: "text-blue-700", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <p className={`text-2xl font-black ${s.color} truncate`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Cari SO Number, part, atau unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#367C2B] bg-white"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Package size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search ? "Tidak ada hasil untuk pencarian ini" : "Belum ada transaksi"}
          </p>
        </div>
      )}

      {/* Mobile: card list */}
      {filtered.length > 0 && (
        <div className="sm:hidden space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-400">{t.soNumber ?? "—"}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">
                    {t.partName ?? t.partNumber ?? "—"}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{fmtDate(t.datePackingSlip)}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{t.qty != null ? `${t.qty} pcs` : "—"}</span>
                <span className="font-bold text-gray-900">{fmt(t.totalPrice)}</span>
                {t.deviceNumber && <span className="font-mono ml-auto">{t.deviceNumber}</span>}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <button
                  onClick={() => setSelected(t)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Eye size={13} /> Lihat Detail
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop: table */}
      {filtered.length > 0 && (
        <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">SO Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Part</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tgl Packing Slip</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">No. Unit</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-mono text-gray-500">{t.soNumber ?? "—"}</p>
                    </td>
                    <td className="px-5 py-4 max-w-48">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.partName ?? "—"}</p>
                      {t.partNumber && (
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{t.partNumber}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {t.qty != null ? `${t.qty} pcs` : "—"}
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900 hidden md:table-cell whitespace-nowrap">
                      {fmt(t.totalPrice)}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">
                      {fmtDate(t.datePackingSlip)}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-500 hidden lg:table-cell">
                      {t.deviceNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelected(t)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat detail"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filtered.length} transaksi ditampilkan</p>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="sm:hidden text-xs text-gray-400 text-center">{filtered.length} transaksi ditampilkan</p>
      )}
    </div>
  )
}
