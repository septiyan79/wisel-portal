"use client"

import { useState } from "react"
import Link from "next/link"

function fmt(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export type FleetRow = {
  fleet: string
  fleetNumber: string | null
  serialNumber: string | null
  pmCount: number
  pmPrice: number
  repairCount: number
  repairPrice: number
  totalCount: number
  totalPrice: number
}

interface Props {
  fleets: FleetRow[]
  totalFleet: number
  pmCount: number
  pmPrice: number
  repairCount: number
  repairPrice: number
  totalCount: number
  totalPrice: number
}

export default function FleetTransactionTable({
  fleets,
  totalFleet,
  pmCount,
  pmPrice,
  repairCount,
  repairPrice,
  totalCount,
  totalPrice,
}: Props) {
  const [search, setSearch] = useState("")

  const filtered = fleets.filter((f) => {
    const q = search.toLowerCase()
    return (
      f.fleet.toLowerCase().includes(q) ||
      (f.serialNumber ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-black text-gray-900">{totalFleet.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Fleet</p>
        </div>

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
          placeholder="Search by fleet or serial number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Fleet</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Serial Number</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">PM Transactions</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Repair Transactions</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Total Transactions</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((row) => (
                  <tr key={row.fleet} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">{row.fleetNumber ?? row.fleet}</td>
                    <td className="px-5 py-4 font-mono text-gray-500">{row.serialNumber ?? "—"}</td>
                    <td className="px-5 py-4 text-right font-bold text-blue-700 whitespace-nowrap">
                      {row.pmPrice > 0 ? fmt(row.pmPrice) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-orange-600 whitespace-nowrap">
                      {row.repairPrice > 0 ? fmt(row.repairPrice) : "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      {fmt(row.totalPrice)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/transactions/by-fleet/${encodeURIComponent(row.fleet)}`}
                        className="p-1.5 text-gray-400 hover:text-[#367C2B] hover:bg-green-50 rounded-lg transition-colors inline-flex"
                        title="View detail"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
