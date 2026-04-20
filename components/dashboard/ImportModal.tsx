"use client"

import { useState, useRef, useCallback } from "react"
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"

type ImportType = "transactions" | "units"

interface CustomerOption {
  customerAccount: string
  customerName: string
}

interface ImportModalProps {
  type: ImportType
  role?: string
  customers?: CustomerOption[]
  onClose: () => void
  onImported: () => void
}

interface ImportResult {
  success: number
  total: number
  errors: { row: number; message: string }[]
}

// ── Template definitions ────────────────────────────────────────

const TRANSACTION_TEMPLATE = [
  {
    "SO Number": "SO-2025-001",
    "Quotation": "Q-001",
    "PO Number": "PO-001",
    "Part Number": "RE504836",
    "AX Part Number": "",
    "Nama Part": "Filter Oli Mesin",
    "Category": "Repair",
    "Qty": 5,
    "Invoice Date": "2025-04-01",
    "Harga Satuan": 240000,
    "Total Harga": 1200000,
    "No. Unit / Device": "",
  },
]

const UNIT_TEMPLATE = [
  {
    "Device Number": "JD-001",
    "Serial Number": "SN-123456",
    "Fleet Number": "FL-01",
    "Model / Tipe": "John Deere 6120",
  },
]

function downloadTemplate(type: ImportType) {
  const data = type === "transactions" ? TRANSACTION_TEMPLATE : UNIT_TEMPLATE
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  XLSX.writeFile(wb, type === "transactions" ? "template_transaksi.xlsx" : "template_unit.xlsx")
}

// ── Component ───────────────────────────────────────────────────

export function ImportModal({ type, role, customers = [], onClose, onImported }: ImportModalProps) {
  const isAdmin = role !== "customer"
  const fileRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [customerAccount, setCustomerAccount] = useState(customers[0]?.customerAccount ?? "")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [apiError, setApiError] = useState("")

  const handleFile = useCallback((f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setApiError("Hanya file Excel (.xlsx / .xls) yang diterima")
      return
    }
    setApiError("")
    setResult(null)
    setFile(f)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setApiError("")
    setResult(null)

    const fd = new FormData()
    fd.append("file", file)
    if (type === "transactions" && isAdmin && customerAccount) {
      fd.append("customerAccount", customerAccount)
    }

    const endpoint = type === "transactions" ? "/api/transactions/import" : "/api/units/import"
    const res = await fetch(endpoint, { method: "POST", body: fd })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setApiError(data.error ?? "Terjadi kesalahan")
    } else {
      setResult(data as ImportResult)
      if ((data as ImportResult).success > 0) onImported()
    }
    setLoading(false)
  }

  const title = type === "transactions" ? "Import Transaksi" : "Import Unit"
  const hasResult = result !== null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#367C2B]" />
            <h3 className="font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Download template */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Unduh Template</p>
              <p className="text-xs text-gray-400 mt-0.5">Gunakan format ini agar import berhasil</p>
            </div>
            <button
              type="button"
              onClick={() => downloadTemplate(type)}
              className="flex items-center gap-2 text-xs font-bold text-[#367C2B] hover:text-[#2d6423] bg-white border border-[#367C2B]/30 hover:border-[#367C2B] px-3 py-2 rounded-lg transition-colors"
            >
              <Download size={13} />
              Template
            </button>
          </div>

          {/* Customer picker — admin only, transactions only */}
          {type === "transactions" && isAdmin && customers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-bold text-amber-700 shrink-0">Atas nama:</span>
              <select
                value={customerAccount}
                onChange={(e) => setCustomerAccount(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-amber-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {customers.map((c) => (
                  <option key={c.customerAccount} value={c.customerAccount}>
                    {c.customerAccount} — {c.customerName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-[#367C2B] bg-green-50"
                : file
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet size={28} className="text-green-600" />
                <p className="text-sm font-semibold text-green-700">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB — klik untuk ganti</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={28} className="text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Drag & drop atau klik untuk pilih file</p>
                <p className="text-xs text-gray-400">Format: .xlsx atau .xls</p>
              </div>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Result */}
          {hasResult && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-lg font-black text-gray-700">{result!.total}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Total Baris</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <p className="text-lg font-black text-green-700">{result!.success}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Berhasil</p>
                </div>
                <div className={`rounded-xl p-3 text-center border ${result!.errors.length > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
                  <p className={`text-lg font-black ${result!.errors.length > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {result!.errors.length}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Gagal</p>
                </div>
              </div>

              {result!.success > 0 && result!.errors.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                  <CheckCircle2 size={16} />
                  Semua data berhasil diimport!
                </div>
              )}

              {/* Error list */}
              {result!.errors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                  <p className="text-xs font-bold text-red-600 px-4 py-2 border-b border-red-100">
                    Baris yang gagal
                  </p>
                  <div className="max-h-36 overflow-y-auto divide-y divide-red-100">
                    {result!.errors.map((err) => (
                      <div key={err.row} className="flex items-start gap-3 px-4 py-2">
                        <span className="text-xs font-bold text-red-400 shrink-0 mt-0.5">Baris {err.row}</span>
                        <span className="text-xs text-red-600">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {hasResult ? "Tutup" : "Batal"}
          </button>
          {!hasResult && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || loading}
              className="flex-1 py-2.5 text-sm font-bold bg-[#367C2B] hover:bg-[#2d6423] disabled:bg-[#367C2B]/40 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Mengimport..." : "Import Sekarang"}
            </button>
          )}
          {hasResult && result!.errors.length > 0 && result!.success === 0 && (
            <button
              type="button"
              onClick={() => { setResult(null); setFile(null) }}
              className="flex-1 py-2.5 text-sm font-bold bg-[#367C2B] hover:bg-[#2d6423] text-white rounded-xl transition-colors"
            >
              Coba Lagi
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
