"use client"

import { X } from "lucide-react"
import type { TransactionRow } from "@/components/dashboard/OrdersTab"

interface OrderDetailModalProps {
  transaction: TransactionRow
  onClose: () => void
}

function fmt(value: number | null | undefined, currency = true) {
  if (value == null) return "—"
  if (currency) return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
  return value.toString()
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

export function OrderDetailModal({ transaction: t, onClose }: OrderDetailModalProps) {
  const rows = [
    { label: "SO Number",     value: t.soNumber     ?? "—", mono: true  },
    { label: "Part Number",   value: t.partNumber   ?? "—", mono: true  },
    { label: "AX Part No.",   value: t.axPartNumber ?? "—", mono: true  },
    { label: "Nama Part",     value: t.partName     ?? "—", mono: false },
    { label: "Qty",               value: t.qty != null ? `${t.qty} pcs` : "—", mono: false },
    { label: "Category",          value: t.category         ?? "—", mono: false },
    { label: "Harga Satuan",      value: fmt(t.unitPrice),           mono: false },
    { label: "Total Harga",       value: fmt(t.totalPrice),          mono: false },
    { label: "Invoice Date",      value: fmtDate(t.invoiceDate),     mono: false },
    { label: "Packing Slip Date", value: fmtDate(t.packingSlipDate), mono: false },
    { label: "No. Unit",      value: t.deviceNumber ?? "—", mono: true  },
    { label: "Akun Customer", value: t.customerAccount ?? "—", mono: true },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Detail Transaksi</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4">
              <span className="text-xs text-gray-500 shrink-0 w-32">{row.label}</span>
              <span className={`text-xs font-semibold text-gray-900 text-right ${row.mono ? "font-mono" : ""}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
