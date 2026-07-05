"use client"

import { useState, useEffect } from "react"
import { Package, Eye, Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react"
import { useSortableTable, SortIcon } from "@/hooks/useSortableTable"
import { useRouter } from "next/navigation"
import { OrderDetailModal } from "./OrderDetailModal"
import { TransactionFormModal } from "./TransactionFormModal"
import { ConfirmModal } from "./ConfirmModal"
import { Pagination } from "./Pagination"
import { ImportModal } from "./ImportModal"

type CustomerOption = { customerAccount: string; customerName: string }

export type TransactionRow = {
  id: string
  soNumber: string | null
  quotation: string | null
  poNumber: string | null
  partNumber: string | null
  axPartNumber: string | null
  partName: string | null
  qty: number | null
  category: string | null
  invoiceDate: string | null
  packingSlipDate: string | null
  unitPrice: number | null
  totalPrice: number | null
  check: string | null
  fleetNumber: string | null
  customerAccount: string | null
  deviceNumber: string | null
  source: string
}

interface OrdersTabProps {
  transactions: TransactionRow[]
  role: string
}

function fmt(value: number | null | undefined) {
  if (value == null) return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

type SortCol = "soNumber" | "partName" | "category" | "qty" | "totalPrice" | "packingSlipDate" | "fleetNumber" | "customerAccount"

export function OrdersTab({ transactions, role }: OrdersTabProps) {
  const router = useRouter()
  const [selected, setSelected]     = useState<TransactionRow | null>(null)
  const [editing, setEditing]       = useState<TransactionRow | null>(null)
  const [adding, setAdding]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TransactionRow | null>(null)
  const [deleting, setDeleting]     = useState(false)
  const [importing, setImporting]   = useState(false)
  const [search, setSearch]         = useState("")
  const [dateFrom, setDateFrom]     = useState("")
  const [dateTo, setDateTo]         = useState("")
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(10)
  const [customers, setCustomers]   = useState<CustomerOption[]>([])
  const [customerFilter, setCustomerFilter] = useState("")
  const { sortCol, sortDir, toggleSort, sortRows } = useSortableTable<SortCol>()

  useEffect(() => { setPage(1) }, [sortCol, sortDir])

  useEffect(() => {
    if (role === "admin") {
      fetch("/api/customers")
        .then((r) => r.json())
        .then((d: CustomerOption[]) => setCustomers(d))
        .catch(() => {})
    }
  }, [role])

  function customerLabel(account: string | null) {
    return customers.find((c) => c.customerAccount === account)?.customerName ?? account ?? "—"
  }

  const filtered = transactions.filter((t) => {
    if (search) {
      const q = search.toLowerCase()
      const matchText =
        t.soNumber?.toLowerCase().includes(q) ||
        t.partName?.toLowerCase().includes(q) ||
        t.partNumber?.toLowerCase().includes(q) ||
        t.deviceNumber?.toLowerCase().includes(q)
      if (!matchText) return false
    }
    if (dateFrom && t.invoiceDate) {
      if (t.invoiceDate.slice(0, 10) < dateFrom) return false
    }
    if (dateTo && t.invoiceDate) {
      if (t.invoiceDate.slice(0, 10) > dateTo) return false
    }
    if (customerFilter && t.customerAccount !== customerFilter) return false
    return true
  })

  const sorted = sortRows(filtered, {
    soNumber:        (a, b) => (a.soNumber ?? "").localeCompare(b.soNumber ?? ""),
    partName:        (a, b) => (a.partName ?? a.partNumber ?? "").localeCompare(b.partName ?? b.partNumber ?? ""),
    category:        (a, b) => (a.category ?? "").localeCompare(b.category ?? ""),
    qty:             (a, b) => (a.qty ?? 0) - (b.qty ?? 0),
    totalPrice:      (a, b) => (a.totalPrice ?? 0) - (b.totalPrice ?? 0),
    packingSlipDate: (a, b) => (a.packingSlipDate ?? "").localeCompare(b.packingSlipDate ?? ""),
    fleetNumber:     (a, b) => (a.fleetNumber ?? a.deviceNumber ?? "").localeCompare(b.fleetNumber ?? b.deviceNumber ?? ""),
    customerAccount: (a, b) => customerLabel(a.customerAccount).localeCompare(customerLabel(b.customerAccount)),
  })

  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize)

  function handleSaved() {
    setAdding(false)
    setEditing(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    await fetch(`/api/transactions/${confirmDelete.id}`, { method: "DELETE" })
    setDeleting(false)
    setConfirmDelete(null)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      {selected && (
        <OrderDetailModal transaction={selected} onClose={() => setSelected(null)} />
      )}
      {(adding || editing) && (
        <TransactionFormModal
          initial={editing}
          role={role}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
      {importing && (
        <ImportModal
          type="transactions"
          role={role}
          customers={customers}
          onClose={() => setImporting(false)}
          onImported={() => { setImporting(false); router.refresh() }}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Delete Transaction?"
          message={`Transaction ${confirmDelete.soNumber ? `"${confirmDelete.soNumber}"` : ""} will be permanently deleted and cannot be recovered.`}
          confirmLabel="Yes, Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Toolbar: search + date range + tambah */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search SO Number, part, or unit..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="flex-1 min-w-48 sm:max-w-72 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#367C2B] bg-white"
        />
        {role === "admin" && customers.length > 0 && (
          <select
            value={customerFilter}
            onChange={(e) => { setCustomerFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B] bg-white shrink-0"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.customerAccount} value={c.customerAccount}>
                {c.customerName}
              </option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B] bg-white"
            title="Invoice Date from"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#367C2B] bg-white"
            title="Invoice Date to"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1) }}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>
        <button
          onClick={() => setImporting(true)}
          className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <FileSpreadsheet size={15} />
          Import Excel
        </button>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-[#367C2B] hover:bg-[#2d6423] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Package size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search ? "No results for this search" : "No transactions yet"}
          </p>
          {!search && (
            <button
              onClick={() => setAdding(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#367C2B] hover:underline"
            >
              <Plus size={14} /> Add first transaction
            </button>
          )}
        </div>
      )}

      {/* Mobile: card list */}
      {filtered.length > 0 && (
        <div className="sm:hidden space-y-3">
          {paginated.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-400">{t.soNumber ?? "—"}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">
                    {t.partName ?? t.partNumber ?? "—"}
                  </p>
                  {role === "admin" && (
                    <p className="text-xs text-gray-400 mt-0.5">{customerLabel(t.customerAccount)}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{fmtDate(t.invoiceDate)}</span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{t.qty != null ? `${t.qty} pcs` : "—"}</span>
                <span className="font-bold text-gray-900">{fmt(t.totalPrice)}</span>
                {t.deviceNumber && <span className="font-mono ml-auto">{t.deviceNumber}</span>}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-gray-50">
                <button
                  onClick={() => setSelected(t)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Eye size={13} /> View
                </button>
                {t.source === "manual" && (
                  <>
                    <button
                      onClick={() => setEditing(t)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(t)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </>
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
                  {(
                    [
                      { col: "soNumber",        label: "SO Number",        cls: "whitespace-nowrap" },
                      ...(role === "admin"
                        ? [{ col: "customerAccount" as SortCol, label: "Customer", cls: "hidden md:table-cell" }]
                        : []),
                      { col: "partName",         label: "Part",             cls: "" },
                      { col: "category",         label: "Category",         cls: "hidden sm:table-cell" },
                      { col: "qty",              label: "Qty",              cls: "" },
                      { col: "totalPrice",       label: "Total",            cls: "hidden md:table-cell" },
                      { col: "packingSlipDate",  label: "Packing Slip Date",cls: "hidden lg:table-cell" },
                      { col: "fleetNumber",      label: "Fleet Number",     cls: "hidden lg:table-cell" },
                    ] as { col: SortCol; label: string; cls: string }[]
                  ).map(({ col, label, cls }) => (
                    <th
                      key={col}
                      onClick={() => toggleSort(col)}
                      className={`px-5 py-3 text-xs font-semibold text-gray-500 text-left cursor-pointer select-none hover:text-gray-800 hover:bg-gray-100/70 transition-colors ${cls}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon active={sortCol === col} dir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-mono text-gray-500">{t.soNumber ?? "—"}</p>
                      {t.source === "manual" && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          manual
                        </span>
                      )}
                      {t.source === "stock_assignment" && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          stock
                        </span>
                      )}
                    </td>
                    {role === "admin" && (
                      <td className="px-5 py-4 text-xs text-gray-600 hidden md:table-cell truncate max-w-40">
                        {customerLabel(t.customerAccount)}
                      </td>
                    )}
                    <td className="px-5 py-4 max-w-48">
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.partName ?? "—"}</p>
                      {t.partNumber && (
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{t.partNumber}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      {t.category === "P" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">PM</span>}
                      {t.category === "R" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Repair</span>}
                      {t.category === "S" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Stock</span>}
                      {!t.category && <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {t.qty != null ? `${t.qty} pcs` : "—"}
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900 hidden md:table-cell whitespace-nowrap">
                      {fmt(t.totalPrice)}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">
                      {fmtDate(t.packingSlipDate)}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-500 hidden lg:table-cell">
                      {t.fleetNumber ?? t.deviceNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View detail"
                        >
                          <Eye size={14} />
                        </button>
                        {t.source === "manual" && (
                          <>
                            <button
                              onClick={() => setEditing(t)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(t)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="sm:hidden bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  )
}
