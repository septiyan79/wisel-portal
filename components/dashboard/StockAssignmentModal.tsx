"use client"

import { useState, useEffect, useRef } from "react"
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
  check: string | null
  packingSlipDate: string | null
  targetUnit: { deviceNumber: string; fleetNumber: string | null; model: string | null }
}

const CHECK_OPTIONS = [
  { value: "", label: "— Select notes —" },
  { value: "Consumable", label: "Consumable" },
  { value: "Accident", label: "Accident" },
  { value: "Modification/improvement", label: "Modification/improvement" },
  { value: "Other", label: "Other" },
]

interface StockAssignmentModalProps {
  stockTransactionId: string
  remainingQty: number
  initial?: Assignment | null
  onClose: () => void
  onSaved: () => void
}

function formatUnitLabel(u: UnitOption) {
  let label = u.deviceNumber
  if (u.model) label += ` — ${u.model}`
  if (u.fleetNumber) label += ` (${u.fleetNumber})`
  return label
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
  const [deviceSearch, setDeviceSearch] = useState(initial?.targetDeviceNumber ?? "")
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false)
  const [qty, setQty] = useState(initial?.qty != null ? String(initial.qty) : "")
  const [check, setCheck] = useState(initial?.check ?? "")
  const [packingSlipDate, setPackingSlipDate] = useState(
    initial?.packingSlipDate ? initial.packingSlipDate.slice(0, 10) : ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const unitsInitialized = useRef(false)

  useEffect(() => {
    fetch("/api/units")
      .then((r) => r.json())
      .then((data: UnitOption[]) => {
        const filtered = data.filter((u) => u.deviceNumber !== "STOCK")
        setUnits(filtered)
        if (!unitsInitialized.current && initial?.targetDeviceNumber) {
          const u = filtered.find((u) => u.deviceNumber === initial.targetDeviceNumber)
          if (u) setDeviceSearch(formatUnitLabel(u))
          unitsInitialized.current = true
        }
      })
      .catch(() => {})
  }, [initial])

  const dropdownUnits = units.filter((u) => {
    const q = deviceSearch.toLowerCase()
    return (
      !q ||
      u.deviceNumber.toLowerCase().includes(q) ||
      u.model?.toLowerCase().includes(q) ||
      u.fleetNumber?.toLowerCase().includes(q)
    )
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!targetDeviceNumber) { setError("Select a target device"); return }
    if (!qty || Number(qty) <= 0) { setError("Qty must be greater than 0"); return }

    setLoading(true)
    const url = isEdit ? `/api/stock-assignments/${initial!.id}` : "/api/stock-assignments"
    const method = isEdit ? "PATCH" : "POST"
    const body = isEdit
      ? { targetDeviceNumber, qty: Number(qty), check: check || null, packingSlipDate: packingSlipDate || null }
      : { stockTransactionId, targetDeviceNumber, qty: Number(qty), check: check || null, packingSlipDate: packingSlipDate || null }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "An error occurred"); return }
    onSaved()
  }

  const maxQty = isEdit ? remainingQty + (initial?.qty ?? 0) : remainingQty

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{isEdit ? "Edit Assignment" : "Assign Stock to Device"}</h3>
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

          {/* Target Device combobox */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Target Device</label>
            <div className="relative">
              <input
                type="text"
                value={deviceSearch}
                onChange={(e) => {
                  setDeviceSearch(e.target.value)
                  setTargetDeviceNumber("")
                  setShowDeviceDropdown(true)
                }}
                onFocus={() => setShowDeviceDropdown(true)}
                onBlur={() => setTimeout(() => setShowDeviceDropdown(false), 150)}
                placeholder="Type to search device..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B]"
              />
              {showDeviceDropdown && dropdownUnits.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                  {dropdownUnits.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={() => {
                        setTargetDeviceNumber(u.deviceNumber)
                        setDeviceSearch(formatUnitLabel(u))
                        setShowDeviceDropdown(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                        targetDeviceNumber === u.deviceNumber ? "bg-green-50 text-[#367C2B] font-semibold" : "text-gray-900"
                      }`}
                    >
                      <span className="font-mono">{u.deviceNumber}</span>
                      {u.model && <span className="text-gray-500"> — {u.model}</span>}
                      {u.fleetNumber && <span className="text-gray-400"> ({u.fleetNumber})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {targetDeviceNumber && (
              <p className="text-[10px] text-[#367C2B] mt-1 font-semibold">Selected: {targetDeviceNumber}</p>
            )}
          </div>

          {/* Qty */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Qty <span className="text-gray-400 font-normal">(max. {maxQty})</span>
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

          {/* Packing Slip Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Packing Slip Date</label>
            <input
              type="date"
              value={packingSlipDate}
              onChange={(e) => setPackingSlipDate(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B]"
            />
          </div>

          {/* Check / Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes</label>
            <select
              value={check}
              onChange={(e) => setCheck(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B]"
            >
              {CHECK_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold bg-[#367C2B] hover:bg-[#2d6423] disabled:bg-[#367C2B]/50 text-white rounded-xl flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
