"use client"

import { useState } from "react"
import { Truck, ChevronRight, Package, Eye, ShoppingCart } from "lucide-react"
import { ORDERS, type Order } from "@/data/customer"
import { StatusBadge } from "./StatusBadge"
import { OrderDetailModal } from "./OrderDetailModal"

export function OrdersTab() {
  const [filterStatus, setFilterStatus] = useState("semua")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = ORDERS.filter(
    (o) => filterStatus === "semua" || o.status === filterStatus
  )

  const activeOrders = ORDERS.filter(
    (o) => o.status !== "selesai" && o.status !== "dibatalkan"
  )

  return (
    <div className="space-y-5">
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Banner order aktif */}
      {activeOrders.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <Truck size={18} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-purple-900">
              {activeOrders.length} order sedang dalam proses
            </p>
            <p className="text-xs text-purple-600 mt-0.5 truncate">
              {activeOrders[0].parts}
            </p>
          </div>
          <button
            onClick={() => setSelectedOrder(activeOrders[0])}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 shrink-0"
          >
            Lihat <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Stat ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Order",  value: ORDERS.length,                                                            color: "text-gray-900",   bg: "bg-gray-50" },
          { label: "Dalam Proses", value: ORDERS.filter(o => !["selesai","dibatalkan"].includes(o.status)).length,  color: "text-purple-700", bg: "bg-purple-50" },
          { label: "Selesai",      value: ORDERS.filter(o => o.status === "selesai").length,                        color: "text-green-700",  bg: "bg-green-50" },
          { label: "Dibatalkan",   value: ORDERS.filter(o => o.status === "dibatalkan").length,                     color: "text-red-600",    bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "semua",      label: "Semua" },
          { value: "dikirim",    label: "Dikirim" },
          { value: "diproses",   label: "Diproses" },
          { value: "menunggu",   label: "Menunggu" },
          { value: "selesai",    label: "Selesai" },
          { value: "dibatalkan", label: "Dibatalkan" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === f.value
                ? "bg-[#367C2B] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Package size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Tidak ada order dengan status ini</p>
        </div>
      )}

      {/* Mobile: card list */}
      {filtered.length > 0 && (
        <div className="sm:hidden space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-400">{order.id}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">{order.parts}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{order.qty} pcs</span>
                <span className="font-bold text-gray-900">{order.total}</span>
                <span className="ml-auto">{order.date}</span>
              </div>

              {order.estimasi && (
                <p className="text-xs text-purple-600">Estimasi tiba: {order.estimasi}</p>
              )}

              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Eye size={13} /> Lihat Detail
                </button>
                {order.status === "selesai" && (
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                    <ShoppingCart size={13} /> Pesan Lagi
                  </button>
                )}
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Order ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Parts</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Total</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggal</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-mono text-gray-500">{order.id}</p>
                    </td>
                    <td className="px-5 py-4 max-w-50">
                      <p className="text-sm font-semibold text-gray-900 truncate">{order.parts}</p>
                      {order.estimasi && (
                        <p className="text-xs text-purple-600 mt-0.5 whitespace-nowrap">Tiba: {order.estimasi}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{order.qty} pcs</td>
                    <td className="px-5 py-4 font-bold text-gray-900 hidden md:table-cell whitespace-nowrap">{order.total}</td>
                    <td className="px-5 py-4 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">{order.date}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Eye size={14} />
                        </button>
                        {order.status === "selesai" && (
                          <button
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Pesan lagi"
                          >
                            <ShoppingCart size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer tabel */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filtered.length} order ditampilkan</p>
            <div className="flex items-center gap-1">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  className={`w-7 h-7 text-xs rounded-lg font-semibold transition-colors ${
                    n === 1 ? "bg-[#367C2B] text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile: order count */}
      {filtered.length > 0 && (
        <p className="sm:hidden text-xs text-gray-400 text-center">{filtered.length} order ditampilkan</p>
      )}
    </div>
  )
}
