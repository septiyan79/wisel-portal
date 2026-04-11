"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Plus, Trash2 } from "lucide-react"
import type { TransactionRow } from "./OrdersTab"

interface TransactionFormModalProps {
  initial?: TransactionRow | null
  onClose: () => void
  onSaved: () => void
}

type FormState = {
  soNumber: string
  quotation: string
  poNumber: string
  partNumber: string
  axPartNumber: string
  partName: string
  qty: string
  invoiceDate: string
  unitPrice: string
  totalPrice: string
  deviceNumber: string
}

const EMPTY: FormState = {
  soNumber: "", quotation: "", poNumber: "", partNumber: "", axPartNumber: "", partName: "",
  qty: "", invoiceDate: "", unitPrice: "", totalPrice: "", deviceNumber: "",
}

const FIELDS: { key: keyof FormState; label: string; type: string; placeholder: string }[] = [
  { key: "soNumber",     label: "SO Number",         type: "text",   placeholder: "Contoh: SO-2025-001" },
  { key: "quotation",    label: "Quotation",         type: "text",   placeholder: "Opsional" },
  { key: "poNumber",     label: "PO Number",         type: "text",   placeholder: "Opsional" },
  { key: "partNumber",   label: "Part Number",       type: "text",   placeholder: "Contoh: RE504836" },
  { key: "axPartNumber", label: "AX Part Number",    type: "text",   placeholder: "Opsional" },
  { key: "partName",     label: "Nama Part",         type: "text",   placeholder: "Contoh: Filter Oli Mesin" },
  { key: "qty",          label: "Qty",               type: "number", placeholder: "0" },
  { key: "invoiceDate",  label: "Invoice Date",      type: "date",   placeholder: "" },
  { key: "unitPrice",    label: "Harga Satuan (Rp)", type: "number", placeholder: "0" },
  { key: "totalPrice",   label: "Total Harga (Rp)",  type: "number", placeholder: "Auto-hitung dari Qty × Satuan" },
  { key: "deviceNumber", label: "No. Unit / Device", type: "text",   placeholder: "Opsional" },
]

function toDateInput(iso: string | null | undefined) {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function TransactionFormModal({ initial, onClose, onSaved }: TransactionFormModalProps) {
  const isEdit = !!initial
  const [forms, setForms] = useState<FormState[]>([{ ...EMPTY }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (initial) {
      setForms([{
        soNumber:     initial.soNumber     ?? "",
        quotation:    initial.quotation    ?? "",
        poNumber:     initial.poNumber     ?? "",
        partNumber:   initial.partNumber   ?? "",
        axPartNumber: initial.axPartNumber ?? "",
        partName:     initial.partName     ?? "",
        qty:          initial.qty != null ? String(initial.qty) : "",
        invoiceDate:  toDateInput(initial.invoiceDate),
        unitPrice:    initial.unitPrice  != null ? String(initial.unitPrice)  : "",
        totalPrice:   initial.totalPrice != null ? String(initial.totalPrice) : "",
        deviceNumber: initial.deviceNumber ?? "",
      }])
    } else {
      setForms([{ ...EMPTY }])
    }
  }, [initial])

  function setField(index: number, field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setForms((prev) =>
        prev.map((form, i) => {
          if (i !== index) return form
          const next = { ...form, [field]: val }
          if (field === "qty" || field === "unitPrice") {
            const q = Number(field === "qty" ? val : next.qty)
            const u = Number(field === "unitPrice" ? val : next.unitPrice)
            if (q > 0 && u > 0) next.totalPrice = String(q * u)
          }
          return next
        })
      )
    }
  }

  function addItem() {
    setForms((prev) => [...prev, { ...EMPTY }])
  }

  function removeItem(index: number) {
    setForms((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    function toPayload(form: FormState) {
      return {
        soNumber:     form.soNumber     || null,
        quotation:    form.quotation    || null,
        poNumber:     form.poNumber     || null,
        partNumber:   form.partNumber   || null,
        axPartNumber: form.axPartNumber || null,
        partName:     form.partName     || null,
        qty:          form.qty          ? Number(form.qty)       : null,
        invoiceDate:  form.invoiceDate  || null,
        unitPrice:    form.unitPrice    ? Number(form.unitPrice)  : null,
        totalPrice:   form.totalPrice   ? Number(form.totalPrice) : null,
        deviceNumber: form.deviceNumber || null,
      }
    }

    if (isEdit) {
      const res = await fetch(`/api/transactions/${initial!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(forms[0])),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Terjadi kesalahan")
        setLoading(false)
        return
      }
    } else {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forms.map(toPayload)),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Terjadi kesalahan")
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900">
              {isEdit ? "Edit Transaksi" : "Tambah Transaksi Manual"}
            </h3>
            {!isEdit && forms.length > 1 && (
              <p className="text-xs text-gray-400 mt-0.5">{forms.length} item akan ditambahkan</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {forms.map((form, index) => (
              <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Card header */}
                {!isEdit && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Item #{index + 1}
                    </span>
                    {forms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50"
                        title="Hapus item ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* Card body */}
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {FIELDS.map(({ key, label, type, placeholder }) => (
                      <div key={key} className={key === "partName" ? "col-span-2 sm:col-span-3" : ""}>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                          {label}
                        </label>
                        <input
                          type={type}
                          value={form[key]}
                          onChange={setField(index, key)}
                          placeholder={placeholder}
                          min={type === "number" ? "0" : undefined}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#367C2B] focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Tambah item */}
            {!isEdit && (
              <button
                type="button"
                onClick={addItem}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#367C2B] hover:text-[#367C2B] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={15} />
                Tambah Item
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold bg-[#367C2B] hover:bg-[#2d6423] disabled:bg-[#367C2B]/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit
                ? "Simpan Perubahan"
                : forms.length > 1
                  ? `Tambah ${forms.length} Transaksi`
                  : "Tambah Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
