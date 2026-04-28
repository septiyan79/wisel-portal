"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"

type UnitOption = {
  id: string
  deviceNumber: string
  model: string | null
  fleetNumber: string | null
}

export type Assignment = {
  id: string
  stockTransactionId: string
  targetDeviceNumber: string
  qty: number
  note: string | null
  targetUnit: { deviceNumber: string; fleetNumber: string | null; model: string | null }
}

interface StockAssignmentModalProps {
  stockTransactionId: string
  remainingQty: number
  initial?: Assignment | null
  onClose: () => void
  onSaved: () => void
}

export function StockAssignmentModal({
  stockTransactionId,
  remainingQty,
  initial,
  onClose,
  onSaved,
}: StockAssignmentModalProps) {
  const isEdit = !!initial
  const [units, setUnits] = useState<UnitOption[]>([])
  const [targetDeviceNumber, setTargetDeviceNumber] = useState(initial?.targetDeviceNumber ?? "")
  const [qty, setQty] = useState(initial?.qty != null ? String(initial.qty) : "")
  const [note, setNote] = useState(initial?.note ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/units")
      .then((r) => r.json())
      .then((data: UnitOption[]) => setUnits(data.filter((u) => u.deviceNumber !== "STOCK")))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!targetDeviceNumber) { setError("Pilih target device"); return }
    if (!qty || Number(qty) <= 0) { setError("Qty harus lebih dari 0"); return }

    setLoading(true)
    const url = isEdit ? `/api/stock-assignments/${initial!.id}` : "/api/stock-assignments"
    const method = isEdit ? "PATCH" : "POST"
    const body = isEdit
      ? { targetDeviceNumber, qty: Number(qty), note: note || null }
      : { stockTransactionId, targetDeviceNumber, qty: Number(qty), note: note || null }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Terjadi kesalahan"); return }
    onSaved()
  }

  const maxQty = isEdit ? remainingQty + (initial?.qty ?? 0) : remainingQty

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isEdit ? "Edit Assignment" : "Assign Stock ke Device"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Target Device</label>
            <select
              value={targetDeviceNumber}
              onChange={(e) => setTargetDeviceNumber(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B]"
            >
              <option value="">— Pilih device —</option>
              {units.map((u) => (
                <option key={u.id} value={u.deviceNumber}>
                  {u.deviceNumber}
                  {u.model ? ` — ${u.model}` : ""}
                  {u.fleetNumber ? ` (${u.fleetNumber})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Qty <span className="text-gray-400 font-normal">(maks. {maxQty})</span>
            </label>
            <input
              type="number"
              min="1"
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Note (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#367C2B]"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold bg-[#367C2B] hover:bg-[#2d6423] disabled:bg-[#367C2B]/50 text-white rounded-xl flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Simpan" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
