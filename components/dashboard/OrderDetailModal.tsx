import { X, CheckCircle, XCircle, Truck, Clock, AlertCircle } from "lucide-react"
import type { Order } from "@/data/customer"
import { STATUS_MAP } from "@/data/customer"

interface OrderDetailModalProps {
  order: Order
  onClose: () => void
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const s = STATUS_MAP[order.status]
  const StatusIcon = s.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 font-[Plus_Jakarta_Sans,Segoe_UI,sans-serif]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Detail Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            order.status === "selesai"    ? "bg-green-50"  :
            order.status === "dikirim"    ? "bg-purple-50" :
            order.status === "dibatalkan" ? "bg-red-50"    : "bg-blue-50"
          }`}>
            <StatusIcon size={20} className={s.iconColor} />
            <div>
              <p className={`text-sm font-bold ${s.iconColor}`}>{s.label}</p>
              {order.note && (
                <p className="text-xs text-gray-500 mt-0.5">{order.note}</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            {[
              { label: "Order ID",   value: order.id,    mono: true },
              { label: "Tanggal",    value: order.date,  mono: false },
              { label: "Parts",      value: order.parts, mono: false },
              { label: "Jumlah",     value: `${order.qty} pcs`, mono: false },
              { label: "Total",      value: order.total, mono: false },
              ...(order.estimasi ? [{ label: "Estimasi tiba", value: order.estimasi, mono: false }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <span className="text-xs text-gray-500 flex-shrink-0 w-28">{row.label}</span>
                <span className={`text-xs font-semibold text-gray-900 text-right ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Tombol aksi */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
            {order.status === "selesai" && (
              <button className="flex-1 py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                Pesan Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
