"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Users, Eye, EyeOff, Loader2, X, ShieldCheck, User } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"

export type UserRow = {
  id: string
  customerAccount: string
  customerName: string
  role: string
  createdAt: string
}

interface UsersTabProps {
  initialUsers: UserRow[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
        <ShieldCheck size={11} />
        Admin
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      <User size={11} />
      Customer
    </span>
  )
}

function UserFormModal({
  mode,
  user,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit"
  user?: UserRow
  onClose: () => void
  onSaved: (row: UserRow) => void
}) {
  const [customerAccount, setCustomerAccount] = useState(user?.customerAccount ?? "")
  const [customerName, setCustomerName] = useState(user?.customerName ?? "")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"customer" | "admin">(
    (user?.role as "customer" | "admin") ?? "customer"
  )
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      let res: Response
      if (mode === "create") {
        res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerAccount, customerName, password, role }),
        })
      } else {
        const body: Record<string, string> = { customerName, role }
        if (password) body.password = password
        res = await fetch(`/api/admin/users/${user!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save user"); return }
      onSaved(data)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const isCreate = mode === "create"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">{isCreate ? "Add User" : "Edit User"}</h3>
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

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Password {!isCreate && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isCreate ? "Min. 6 characters" : "New password (optional)"}
                required={isCreate}
                minLength={isCreate ? 6 : undefined}
                className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  role === "customer"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <User size={14} />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  role === "admin"
                    ? "bg-purple-50 border-purple-300 text-purple-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <ShieldCheck size={14} />
                Admin
              </button>
            </div>
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
              {isCreate ? "Create User" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UsersTab({ initialUsers }: UsersTabProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<UserRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const filtered = users.filter(
    (u) =>
      u.customerAccount.toLowerCase().includes(search.toLowerCase()) ||
      u.customerName.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  )

  function handleCreated(row: UserRow) {
    setUsers((prev) => [row, ...prev])
    setShowForm(false)
  }

  function handleUpdated(row: UserRow) {
    setUsers((prev) => prev.map((u) => (u.id === row.id ? row : u)))
    setEditTarget(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError("")
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { setDeleteError(data.error ?? "Failed to delete"); return }
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id))
      setDeleteTarget(null)
      router.refresh()
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account, name, or role..."
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-64"
            />
            <span className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#367C2B] hover:bg-[#2d6423] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            <Plus size={15} />
            Add User
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">{search ? "No users match your search." : "No users yet."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Account ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Company Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Created</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-semibold text-gray-700">
                        {u.customerAccount}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-gray-900">{u.customerName}</td>
                    <td className="py-3 pr-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditTarget(u)}
                          className="text-gray-400 hover:text-[#367C2B] transition-colors p-1.5 rounded-lg hover:bg-green-50"
                          title="Edit user"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteError(""); setDeleteTarget(u) }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
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

      {showForm && (
        <UserFormModal
          mode="create"
          onClose={() => setShowForm(false)}
          onSaved={handleCreated}
        />
      )}

      {editTarget && (
        <UserFormModal
          mode="edit"
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleUpdated}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Account "${deleteTarget.customerAccount}" (${deleteTarget.customerName}) will be permanently deleted. This only removes login access — transaction data is preserved.${deleteError ? `\n\nError: ${deleteError}` : ""}`}
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
