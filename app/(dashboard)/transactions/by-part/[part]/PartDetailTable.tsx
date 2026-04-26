"use client"

import { useState } from "react"
import { Pagination } from "@/components/dashboard/Pagination"

function fmt(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

type CategoryCode = "P" | "R" | "M" | "O"

function CategoryBadge({ code }: { code: CategoryCode }) {
  const map: Record<CategoryCode, { label: string; cls: string }> = {
    P: { label: "PM",          cls: "bg-blue-100 text-blue-700" },
    R: { label: "Repair",      cls: "bg-orange-100 text-orange-600" },
    M: { label: "PM + Repair", cls: "bg-purple-100 text-purple-700" },
    O: { label: "Other",       cls: "bg-gray-100 text-gray-600" },
  }
  const { label, cls } = map[code]
  return (
    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

export type FleetRow = {
  fleetLabel: string
  category: CategoryCode
  qty: number
  totalPrice: number
  latestPackingSlipDate: string | null
  latestDate: string | null
}

interface Props {
  rows: FleetRow[]
  pmCount: number
  pmPrice: number
  repairCount: number
  repairPrice: number
  totalCount: number
  totalPrice: number
}

export default function PartDetailTable({
  rows,
  pmCount,
  pmPrice,
  repairCount,
  repairPrice,
  totalCount,
  totalPrice,
}: Props) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = rows.filter((r) =>
    r.fleetLabel.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50 rounded-xl p-4 border border-gray-100">
          <span className="inline-block text-[11px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mb-2">
            {pmCount.toLocaleString("id-ID")} tx
          </span>
          <p className="text-lg font-black text-blue-700 truncate">{fmt(pmPrice)}</p>
          <p className="text-xs text-gray-500 mt-0.5">PM Transactions</p>
        </div>

        <div className="bg-orange-50 rounded-xl p-4 border border-gray-100">
          <span className="inline-block text-[11px] font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mb-2">
            {repairCount.toLocaleString("id-ID")} tx
          </span>
          <p className="text-lg font-black text-orange-600 truncate">{fmt(repairPrice)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Repair Transactions</p>
        </div>

        <div className="bg-green-50 rounded-xl p-4 border border-gray-100">
          <span className="inline-block text-[11px] font-bold bg-green-100 text-[#367C2B] px-2 py-0.5 rounded-full mb-2">
            {totalCount.toLocaleString("id-ID")} tx
          </span>
          <p className="text-lg font-black text-[#367C2B] truncate">{fmt(totalPrice)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Transactions</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by fleet number..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 min-w-48 sm:max-w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#367C2B] bg-white"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-sm text-gray-400">
            {search ? "No results for this search." : "No transaction data."}
          </p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Fleet Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Qty</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Price</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Packing Slip Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Invoice Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((row) => (
                  <tr key={row.fleetLabel} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                      {row.fleetLabel}
                    </td>
                    <td className="px-5 py-4">
                      <CategoryBadge code={row.category} />
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-700 whitespace-nowrap">
                      {row.qty.toLocaleString("id-ID")}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      {fmt(row.totalPrice)}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(row.latestPackingSlipDate)}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-gray-400 whitespace-nowrap">
                      {fmtDate(row.latestDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      )}
    </div>
  )
}
