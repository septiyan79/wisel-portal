"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Building2, Loader2, X, Search } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"
import { Pagination } from "./Pagination"

export type CustomerRow = {
  id: string
  customerAccount: string
  customerName: string
  createdAt: string
  userCount: number
  unitCount: number
  transactionCount: number
  apiKeyCount: number
}

interface CustomersTabProps {
  initialCustomers: CustomerRow[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function CustomerFormModal({
  mode,
  customer,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit"
  customer?: CustomerRow
  onClose: () => void
  onSaved: (row: CustomerRow) => void
}) {
  const [customerAccount, setCustomerAccount] = useState(customer?.customerAccount ?? "")
  const [customerName, setCustomerName] = useState(customer?.customerName ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isCreate = mode === "create"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = isCreate
        ? await fetch("/api/admin/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerAccount, customerName }),
          })
        : await fetch(`/api/admin/customers/${customer!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ customerName }),
          })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save customer"); return }
      onSaved(data)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">{isCreate ? "Add Customer" : "Edit Customer"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account ID</label>
            <input
              type="text"
              value={customerAccount}
              onChange={(e) => setCustomerAccount(e.target.value.toUpperCase())}
              placeholder="e.g. W0001"
              required
              disabled={!isCreate}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. PT Agro Nusantara"
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[#367C2B] hover:bg-[#2d6423] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isCreate ? "Create Customer" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function CustomersTab({ initialCustomers }: CustomersTabProps) {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerRow[]>(initialCustomers)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<CustomerRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const filtered = customers.filter(
    (c) =>
      c.customerAccount.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function handleCreated(row: CustomerRow) {
    setCustomers((prev) => [row, ...prev])
    setShowForm(false)
  }

  function handleUpdated(row: CustomerRow) {
    setCustomers((prev) => prev.map((c) => (c.id === row.id ? row : c)))
    setEditTarget(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError("")
    try {
      const res = await fetch(`/api/admin/customers/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error ?? "Failed to delete"); return }
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      setDeleteError("Network error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search account or company name..."
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-64"
              />
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} customer{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#367C2B] hover:bg-[#2d6423] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            <Plus size={15} />
            Add Customer
          </button>
        </div>

        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between mb-4">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError("")} className="text-red-400 hover:text-red-600 ml-3">
              <X size={14} />
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{search ? "No customers match your search." : "No customers yet."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Account ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Company Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Users</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Units</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4 hidden md:table-cell">Transactions</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4 hidden lg:table-cell">Created</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((c) => {
                  const hasLinkedData = c.userCount > 0 || c.unitCount > 0 || c.transactionCount > 0 || c.apiKeyCount > 0
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700">
                          {c.customerAccount}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">{c.customerName}</td>
                      <td className="py-3 pr-4 text-xs text-gray-500">{c.userCount}</td>
                      <td className="py-3 pr-4 text-xs text-gray-500">{c.unitCount}</td>
                      <td className="py-3 pr-4 text-xs text-gray-500 hidden md:table-cell">{c.transactionCount}</td>
                      <td className="py-3 pr-4 text-xs text-gray-500 hidden lg:table-cell">{formatDate(c.createdAt)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditTarget(c)}
                            className="text-gray-400 hover:text-[#367C2B] transition-colors p-1.5 rounded-lg hover:bg-green-50"
                            title="Edit customer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { setDeleteError(""); setDeleteTarget(c) }}
                            disabled={hasLinkedData}
                            title={hasLinkedData ? "Cannot delete: this customer has linked data" : "Delete customer"}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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

      {showForm && (
        <CustomerFormModal
          mode="create"
          onClose={() => setShowForm(false)}
          onSaved={handleCreated}
        />
      )}

      {editTarget && (
        <CustomerFormModal
          mode="edit"
          customer={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleUpdated}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Customer"
          message={`Account "${deleteTarget.customerAccount}" (${deleteTarget.customerName}) will be permanently deleted.${deleteError ? `\n\nError: ${deleteError}` : ""}`}
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
