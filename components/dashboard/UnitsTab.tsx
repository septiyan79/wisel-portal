"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Cpu, Loader2, X, Search } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"

export type UnitRow = {
  id: string
  deviceNumber: string
  serialNumber: string | null
  fleetNumber: string | null
  model: string | null
  createdAt: string
}

interface UnitsTabProps {
  units: UnitRow[]
}

type UnitForm = {
  deviceNumber: string
  serialNumber: string
  fleetNumber: string
  model: string
}

const EMPTY_FORM: UnitForm = { deviceNumber: "", serialNumber: "", fleetNumber: "", model: "" }

function UnitFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: UnitRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<UnitForm>(
    initial
      ? {
          deviceNumber: initial.deviceNumber,
          serialNumber: initial.serialNumber ?? "",
          fleetNumber:  initial.fleetNumber  ?? "",
          model:        initial.model        ?? "",
        }
      : { ...EMPTY_FORM }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(field: keyof UnitForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const payload = {
      deviceNumber: form.deviceNumber,
      serialNumber: form.serialNumber || null,
      fleetNumber:  form.fleetNumber  || null,
      model:        form.model        || null,
    }

    const url    = isEdit ? `/api/units/${initial!.id}` : "/api/units"
    const method = isEdit ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Terjadi kesalahan")
      setLoading(false)
      return
    }

    setLoading(false)
    onSaved()
  }

  const fields: { key: keyof UnitForm; label: string; placeholder: string; required?: boolean }[] = [
    { key: "deviceNumber", label: "Device Number",  placeholder: "Contoh: JD-001",         required: true },
    { key: "serialNumber", label: "Serial Number",  placeholder: "Opsional" },
    { key: "fleetNumber",  label: "Fleet Number",   placeholder: "Opsional" },
    { key: "model",        label: "Model / Tipe",   placeholder: "Contoh: John Deere 6120" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            {isEdit ? "Edit Unit" : "Tambah Unit"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {fields.map(({ key, label, placeholder, required }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={set(key)}
                  placeholder={placeholder}
                  required={required}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#367C2B] focus:border-transparent"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
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
              {isEdit ? "Simpan Perubahan" : "Tambah Unit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function UnitsTab({ units }: UnitsTabProps) {
  const router = useRouter()
  const [search, setSearch]     = useState("")
  const [adding, setAdding]     = useState(false)
  const [editing, setEditing]   = useState<UnitRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<UnitRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = units.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.deviceNumber.toLowerCase().includes(q) ||
      u.serialNumber?.toLowerCase().includes(q) ||
      u.fleetNumber?.toLowerCase().includes(q) ||
      u.model?.toLowerCase().includes(q)
    )
  })

  function handleSaved() {
    setAdding(false)
    setEditing(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleteError(null)
    setDeleting(true)
    const res = await fetch(`/api/units/${confirmDelete.id}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setDeleteError(data.error ?? "Gagal menghapus unit")
    } else {
      router.refresh()
    }
    setDeleting(false)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-5">
      {(adding || editing) && (
        <UnitFormModal
          initial={editing}
          onClose={() => { setAdding(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Hapus Unit?"
          message={`Unit "${confirmDelete.deviceNumber}"${confirmDelete.model ? ` (${confirmDelete.model})` : ""} akan dihapus permanen.`}
          confirmLabel="Ya, Hapus"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-black text-gray-900">{units.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Unit Terdaftar</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-black text-green-700">
            {units.filter((u) => u.model).length}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Dengan Data Model</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 sm:max-w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari device, serial, atau model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#367C2B] bg-white"
          />
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 bg-[#367C2B] hover:bg-[#2d6423] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          <Plus size={15} />
          Tambah Unit
        </button>
      </div>

      {/* Delete error toast */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600 ml-3">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Cpu size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            {search ? "Tidak ada hasil untuk pencarian ini" : "Belum ada unit terdaftar"}
          </p>
          {!search && (
            <button
              onClick={() => setAdding(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#367C2B] hover:underline"
            >
              <Plus size={14} /> Tambah unit pertama
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Device Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Serial Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Fleet Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Model / Tipe</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-gray-900 font-mono">{u.deviceNumber}</p>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-gray-500 hidden sm:table-cell">
                      {u.serialNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 hidden md:table-cell">
                      {u.fleetNumber ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {u.model ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditing(u)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
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
          <div className="px-5 py-3.5 border-t border-gray-100">
            <p className="text-xs text-gray-400">{filtered.length} unit ditampilkan</p>
          </div>
        </div>
      )}
    </div>
  )
}
