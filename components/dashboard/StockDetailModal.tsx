"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { StockAssignmentModal, type Assignment } from "./StockAssignmentModal"

export type StockRow = {
  id: string
  soNumber: string | null
  partNumber: string | null
  axPartNumber: string | null
  partName: string | null
  qty: number | null
  invoiceDate: string | null
  packingSlipDate: string | null
  unitPrice: number | null
  totalPrice: number | null
  customerAccount: string | null
  assignedQty: number
}

interface StockDetailModalProps {
  row: StockRow
  onClose: () => void
  onChanged: () => void
}

function fmt(n: number | null | undefined) {
  if (n == null) return "—"
  return n.toLocaleString("id-ID")
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function statusBadge(remaining: number, total: number | null) {
  if (total == null) return null
  if (remaining === 0)
    return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">Fully Assigned</span>
  if (remaining < total)
    return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">Partial</span>
  return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-500">Unassigned</span>
}

export function StockDetailModal({ row, onClose, onChanged }: StockDetailModalProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssign, setLoadingAssign] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Assignment | null>(null)

  const fetchAssignments = useCallback(async () => {
    setLoadingAssign(true)
    try {
      const res = await fetch(`/api/stock-assignments?transactionId=${row.id}`)
      const data = await res.json()
      setAssignments(Array.isArray(data) ? data : [])
    } finally {
      setLoadingAssign(false)
    }
  }, [row.id])

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  const totalAssigned = assignments.reduce((s, a) => s + a.qty, 0)
  const remaining = (row.qty ?? 0) - totalAssigned

  async function handleDelete(id: string) {
    if (!confirm("Hapus assignment ini?")) return
    setDeletingId(id)
    await fetch(`/api/stock-assignments/${id}`, { method: "DELETE" })
    setDeletingId(null)
    fetchAssignments()
    onChanged()
  }

  function handleSaved() {
    setShowAssignModal(false)
    setEditTarget(null)
    fetchAssignments()
    onChanged()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h3 className="font-bold text-gray-900">Stock Detail</h3>
              {row.soNumber && <p className="text-xs text-gray-400 mt-0.5">{row.soNumber}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Info transaksi */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Part Number</span>
                <p className="text-gray-900 font-medium">{row.partNumber || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">AX Part Number</span>
                <p className="text-gray-900 font-medium">{row.axPartNumber || "—"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Part Name</span>
                <p className="text-gray-900 font-medium">{row.partName || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Invoice Date</span>
                <p className="text-gray-900">{fmtDate(row.invoiceDate)}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Packing Slip Date</span>
                <p className="text-gray-900">{fmtDate(row.packingSlipDate)}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Unit Price</span>
                <p className="text-gray-900">Rp {fmt(row.unitPrice)}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Total Price</span>
                <p className="text-gray-900 font-semibold">Rp {fmt(row.totalPrice)}</p>
              </div>
            </div>

            {/* Qty summary */}
            <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-black text-gray-900">{row.qty ?? 0}</p>
                <p className="text-xs text-gray-400">Total Qty</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-black text-[#367C2B]">{totalAssigned}</p>
                <p className="text-xs text-gray-400">Assigned</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="text-center">
                <p className="text-2xl font-black text-amber-600">{remaining}</p>
                <p className="text-xs text-gray-400">Remaining</p>
              </div>
              <div className="ml-auto">{statusBadge(remaining, row.qty)}</div>
            </div>

            {/* Tabel assignments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700">Assignments</h4>
                {remaining > 0 && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#367C2B] text-white rounded-lg hover:bg-[#2d6423]"
                  >
                    <Plus size={12} /> Assign
                  </button>
                )}
              </div>

              {loadingAssign ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-gray-300" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Belum ada assignment</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500">Device</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500">Fleet No.</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500">Qty</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500">Packing Slip Date</th>
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500">Check</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-900">{a.targetDeviceNumber}</td>
                          <td className="px-4 py-3 text-gray-600">{a.targetUnit.fleetNumber || "—"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">{a.qty}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(a.packingSlipDate)}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{a.check || "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <button
                                onClick={() => setEditTarget(a)}
                                className="p-1.5 text-gray-400 hover:text-[#367C2B] rounded-lg hover:bg-green-50"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(a.id)}
                                disabled={deletingId === a.id}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50"
                              >
                                {deletingId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {(showAssignModal || editTarget) && (
        <StockAssignmentModal
          stockTransactionId={row.id}
          remainingQty={remaining}
          initial={editTarget}
          onClose={() => { setShowAssignModal(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
