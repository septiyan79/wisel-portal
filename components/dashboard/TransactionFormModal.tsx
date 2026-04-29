"use client"

import { useState, useEffect, useRef } from "react"
import { X, Loader2, Plus, Trash2, Info } from "lucide-react"
import type { TransactionRow } from "./OrdersTab"

type UnitOption = {
  id: string
  deviceNumber: string
  model: string | null
  fleetNumber: string | null
}

type CustomerOption = {
  customerAccount: string
  customerName: string
}

interface TransactionFormModalProps {
  initial?: TransactionRow | null
  role: string
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
  category: string
  invoiceDate: string
  packingSlipDate: string
  unitPrice: string
  totalPrice: string
  deviceNumber: string
  check: string
}

const EMPTY: FormState = {
  soNumber: "", quotation: "", poNumber: "", partNumber: "", axPartNumber: "", partName: "",
  qty: "", category: "R", invoiceDate: "", packingSlipDate: "", unitPrice: "", totalPrice: "",
  deviceNumber: "", check: "",
}

const CHECK_OPTIONS = [
  { value: "", label: "— Select notes —" },
  { value: "Consumable", label: "Consumable" },
  { value: "Accident", label: "Accident" },
  { value: "Modification/improvement", label: "Modification/improvement" },
  { value: "Other", label: "Other" },
]

const FIELDS: { key: keyof FormState; label: string; type: string; placeholder: string; info?: string }[] = [
  { key: "quotation",       label: "Quotation",            type: "text",   placeholder: "Optional" },
  { key: "poNumber",        label: "PO Number",            type: "text",   placeholder: "Optional" },
  { key: "partNumber",      label: "Part Number",          type: "text",   placeholder: "e.g. RE504836" },
  { key: "axPartNumber",    label: "Wisel Part Number",    type: "text",   placeholder: "Optional" },
  { key: "partName",        label: "Part Name",            type: "text",   placeholder: "e.g. Oil Filter" },
  { key: "qty",             label: "Qty",                  type: "number", placeholder: "0" },
  { key: "invoiceDate",     label: "Invoice Date",         type: "date",   placeholder: "" },
  { key: "packingSlipDate", label: "Packing Slip Date",    type: "date",   placeholder: "", info: "Tanggal Repair / Pasang" },
  { key: "unitPrice",       label: "Unit Price (Rp)",      type: "number", placeholder: "0" },
  { key: "totalPrice",      label: "Total Price (Rp)",     type: "number", placeholder: "Auto-calculated from Qty × Unit Price" },
]

function formatUnitLabel(u: UnitOption) {
  let label = u.deviceNumber
  if (u.model) label += ` — ${u.model}`
  if (u.fleetNumber) label += ` (${u.fleetNumber})`
  return label
}

function toDateInput(iso: string | null | undefined) {
  if (!iso) return ""
  return iso.slice(0, 10)
}

function isFormEmpty(form: FormState): boolean {
  const { category, check, ...rest } = form
  return Object.values(rest).every((v) => v === "" || v === "0")
}

export function TransactionFormModal({ initial, role, onClose, onSaved }: TransactionFormModalProps) {
  const isEdit = !!initial
  const isAdmin = role !== "customer"

  const [forms, setForms] = useState<FormState[]>([{ ...EMPTY }])
  const [customerAccount, setCustomerAccount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [units, setUnits] = useState<UnitOption[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])

  const [deviceSearches, setDeviceSearches] = useState<string[]>([""])
  const [deviceDropdowns, setDeviceDropdowns] = useState<boolean[]>([false])
  const [dropdownRects, setDropdownRects] = useState<Array<{ top: number; left: number; width: number } | null>>([null])
  const deviceWrapperRefs = useRef<Array<HTMLDivElement | null>>([])
  const formsRef = useRef(forms)
  formsRef.current = forms

  useEffect(() => {
    fetch("/api/units")
      .then((r) => r.json())
      .then((data: UnitOption[]) => setUnits(data.filter((u) => u.deviceNumber !== "STOCK")))
      .catch(() => {})

    if (isAdmin) {
      fetch("/api/customers")
        .then((r) => r.json())
        .then((data: CustomerOption[]) => {
          setCustomers(data)
          if (data.length > 0) setCustomerAccount(data[0].customerAccount)
        })
        .catch(() => {})
    }
  }, [isAdmin])

  // When units load, update device search text for pre-filled deviceNumbers
  useEffect(() => {
    if (units.length > 0) {
      setDeviceSearches((prev) =>
        prev.map((s, i) => {
          const dn = formsRef.current[i]?.deviceNumber
          if (!dn || s !== dn) return s
          const u = units.find((u) => u.deviceNumber === dn)
          return u ? formatUnitLabel(u) : s
        })
      )
    }
  }, [units])

  useEffect(() => {
    if (initial) {
      const dn = initial.deviceNumber ?? ""
      setForms([{
        soNumber:        initial.soNumber        ?? "",
        quotation:       initial.quotation        ?? "",
        poNumber:        initial.poNumber         ?? "",
        partNumber:      initial.partNumber       ?? "",
        axPartNumber:    initial.axPartNumber     ?? "",
        partName:        initial.partName         ?? "",
        qty:             initial.qty != null ? String(initial.qty) : "",
        category:        initial.category         ?? "R",
        invoiceDate:     toDateInput(initial.invoiceDate),
        packingSlipDate: toDateInput(initial.packingSlipDate),
        unitPrice:       initial.unitPrice  != null ? String(initial.unitPrice)  : "",
        totalPrice:      initial.totalPrice != null ? String(initial.totalPrice) : "",
        deviceNumber:    dn,
        check:           initial.check ?? "",
      }])
      setDeviceSearches([dn])
      setDeviceDropdowns([false])
      setDropdownRects([null])
      if (isAdmin && initial.customerAccount) setCustomerAccount(initial.customerAccount)
    } else {
      setForms([{ ...EMPTY }])
      setDeviceSearches([""])
      setDeviceDropdowns([false])
      setDropdownRects([null])
    }
  }, [initial, isAdmin])

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

  function openDeviceDropdown(index: number) {
    const wrapper = deviceWrapperRefs.current[index]
    if (wrapper) {
      const rect = wrapper.getBoundingClientRect()
      setDropdownRects((prev) => {
        const next = [...prev]
        next[index] = { top: rect.bottom + 4, left: rect.left, width: rect.width }
        return next
      })
    }
    setDeviceDropdowns((prev) => prev.map((_, i) => i === index ? true : _))
  }

  function setDeviceNumber(index: number, deviceNumber: string, displayText: string) {
    setForms((prev) =>
      prev.map((f, i) => i === index ? { ...f, deviceNumber } : f)
    )
    setDeviceSearches((prev) => prev.map((s, i) => i === index ? displayText : s))
    setDeviceDropdowns((prev) => prev.map((_, i) => i === index ? false : _))
  }

  function handleDeviceSearchChange(index: number, value: string) {
    setDeviceSearches((prev) => prev.map((s, i) => i === index ? value : s))
    setForms((prev) => prev.map((f, i) => i === index ? { ...f, deviceNumber: "" } : f))
    setDeviceDropdowns((prev) => prev.map((_, i) => i === index ? true : _))
  }

  function addItem() {
    setForms((prev) => [...prev, { ...EMPTY }])
    setDeviceSearches((prev) => [...prev, ""])
    setDeviceDropdowns((prev) => [...prev, false])
    setDropdownRects((prev) => [...prev, null])
  }

  function removeItem(index: number) {
    setForms((prev) => prev.filter((_, i) => i !== index))
    setDeviceSearches((prev) => prev.filter((_, i) => i !== index))
    setDeviceDropdowns((prev) => prev.filter((_, i) => i !== index))
    setDropdownRects((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const emptyIndexes = forms
      .map((f, i) => (isFormEmpty(f) ? i + 1 : null))
      .filter((v): v is number => v !== null)

    if (emptyIndexes.length > 0) {
      setError(
        emptyIndexes.length === 1
          ? `Item #${emptyIndexes[0]} is empty. Fill at least one field or remove it.`
          : `Items #${emptyIndexes.join(", #")} are empty. Fill at least one field or remove them.`
      )
      return
    }

    setLoading(true)

    function toPayload(form: FormState) {
      return {
        soNumber:        form.soNumber     || null,
        quotation:       form.quotation    || null,
        poNumber:        form.poNumber     || null,
        partNumber:      form.partNumber   || null,
        axPartNumber:    form.axPartNumber || null,
        partName:        form.partName     || null,
        qty:             form.qty             ? Number(form.qty)        : null,
        category:        form.category        || "R",
        invoiceDate:     form.invoiceDate     || null,
        packingSlipDate: form.packingSlipDate || null,
        unitPrice:       form.unitPrice       ? Number(form.unitPrice)  : null,
        totalPrice:      form.totalPrice      ? Number(form.totalPrice) : null,
        deviceNumber:    form.deviceNumber    || null,
        check:           form.check           || null,
        ...(isAdmin && { customerAccount }),
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
        setError(data.error ?? "An error occurred")
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
        setError(data.error ?? "An error occurred")
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
              {isEdit ? "Edit Transaction" : "Add Manual Transaction"}
            </h3>
            {!isEdit && forms.length > 1 && (
              <p className="text-xs text-gray-400 mt-0.5">{forms.length} items will be added</p>
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

            {/* Customer picker — admin only */}
            {isAdmin && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xs font-bold text-amber-700 shrink-0">On behalf of:</span>
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

            {forms.map((form, index) => {
              const filteredUnits = units.filter((u) => {
                const q = deviceSearches[index]?.toLowerCase() ?? ""
                return (
                  !q ||
                  u.deviceNumber.toLowerCase().includes(q) ||
                  u.model?.toLowerCase().includes(q) ||
                  u.fleetNumber?.toLowerCase().includes(q)
                )
              })

              return (
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
                          title="Remove this item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Card body */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {FIELDS.map(({ key, label, type, placeholder, info }) => (
                        <div key={key} className={key === "partName" ? "col-span-2 sm:col-span-3" : ""}>
                          <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1.5">
                            {label}
                            {info && (
                              <span className="relative group/tip ml-0.5 inline-flex cursor-help">
                                <Info size={11} className="text-gray-400" />
                                <span className="absolute left-4 bottom-full mb-1 z-20 bg-gray-800 text-white text-[10px] leading-snug px-2 py-1.5 rounded shadow-lg w-36 whitespace-normal opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity">
                                  {info}
                                </span>
                              </span>
                            )}
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

                      {/* Notes dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                          Notes
                        </label>
                        <select
                          value={form.check}
                          onChange={(e) =>
                            setForms((prev) =>
                              prev.map((f, i) =>
                                i === index ? { ...f, check: e.target.value } : f
                              )
                            )
                          }
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B] focus:border-transparent bg-white"
                        >
                          {CHECK_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Device combobox */}
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                          Unit / Device No.
                        </label>
                        <div
                          ref={(el) => { deviceWrapperRefs.current[index] = el }}
                          className="relative"
                        >
                          <input
                            type="text"
                            value={deviceSearches[index] ?? ""}
                            onChange={(e) => handleDeviceSearchChange(index, e.target.value)}
                            onFocus={() => openDeviceDropdown(index)}
                            onBlur={() =>
                              setTimeout(() =>
                                setDeviceDropdowns((prev) =>
                                  prev.map((_, i) => i === index ? false : _)
                                ), 150
                              )
                            }
                            placeholder="Type to search device..."
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#367C2B] focus:border-transparent"
                          />
                          {deviceDropdowns[index] && filteredUnits.length > 0 && dropdownRects[index] && (
                            <div
                              style={{
                                position: "fixed",
                                top: dropdownRects[index]!.top,
                                left: dropdownRects[index]!.left,
                                width: dropdownRects[index]!.width,
                              }}
                              className="z-200 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto"
                            >
                              {filteredUnits.map((u) => (
                                <button
                                  key={u.id}
                                  type="button"
                                  onMouseDown={() => setDeviceNumber(index, u.deviceNumber, formatUnitLabel(u))}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                                    form.deviceNumber === u.deviceNumber ? "bg-green-50 text-[#367C2B] font-semibold" : "text-gray-900"
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
                        {form.deviceNumber && (
                          <p className="text-[10px] text-[#367C2B] mt-1 font-semibold">
                            Selected: {form.deviceNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add item */}
            {!isEdit && (
              <button
                type="button"
                onClick={addItem}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#367C2B] hover:text-[#367C2B] transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={15} />
                Add Item
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold bg-[#367C2B] hover:bg-[#2d6423] disabled:bg-[#367C2B]/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEdit
                ? "Save Changes"
                : forms.length > 1
                  ? `Add ${forms.length} Transactions`
                  : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
