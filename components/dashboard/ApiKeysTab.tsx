"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Key, Copy, Check, Loader2, X } from "lucide-react"
import { ConfirmModal } from "./ConfirmModal"

export type ApiKeyRow = {
  id: string
  label: string
  customerAccount: string
  customerName: string
  isActive: boolean
  createdAt: string
  lastUsedAt: string | null
}

type CustomerOption = {
  customerAccount: string
  customerName: string
}

interface ApiKeysTabProps {
  initialKeys: ApiKeyRow[]
  customers: CustomerOption[]
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

function GenerateModal({
  customers,
  onClose,
  onCreated,
}: {
  customers: CustomerOption[]
  onClose: () => void
  onCreated: (key: string, row: ApiKeyRow) => void
}) {
  const [customerAccount, setCustomerAccount] = useState("")
  const [label, setLabel] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerAccount, label }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to generate key"); return }
      const customer = customers.find((c) => c.customerAccount === customerAccount)!
      onCreated(data.key, {
        id: data.id,
        label: data.label,
        customerAccount: data.customerAccount,
        customerName: customer.customerName,
        isActive: true,
        createdAt: data.createdAt,
        lastUsedAt: null,
      })
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
          <h3 className="font-bold text-gray-900">Generate API Key</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer</label>
            <select
              value={customerAccount}
              onChange={(e) => setCustomerAccount(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
            >
              <option value="">— Pilih Customer —</option>
              {customers.map((c) => (
                <option key={c.customerAccount} value={c.customerAccount}>
                  {c.customerAccount} — {c.customerName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. ERP System, Mobile App"
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
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function KeyRevealModal({ apiKey, onClose }: { apiKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Key size={16} className="text-green-700" />
          </div>
          <h3 className="font-bold text-gray-900">API Key Generated</h3>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700 font-semibold">Simpan key ini sekarang — tidak akan ditampilkan lagi.</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
          <code className="text-xs text-gray-800 font-mono flex-1 break-all">{apiKey}</code>
          <button
            onClick={copy}
            className="shrink-0 p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
            title="Copy"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Gunakan di header HTTP: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer {apiKey.slice(0, 12)}...</code>
        </p>
        <button
          onClick={onClose}
          className="w-full py-2.5 text-sm font-bold text-white bg-[#367C2B] hover:bg-[#2d6423] rounded-xl transition-colors"
        >
          Selesai
        </button>
      </div>
    </div>
  )
}

export function ApiKeysTab({ initialKeys, customers }: ApiKeysTabProps) {
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys)
  const [showGenerate, setShowGenerate] = useState(false)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null)
  const [revoking, setRevoking] = useState(false)

  function handleCreated(key: string, row: ApiKeyRow) {
    setShowGenerate(false)
    setKeys((prev) => [row, ...prev])
    setRevealedKey(key)
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await fetch(`/api/admin/api-keys/${revokeTarget.id}`, { method: "DELETE" })
      setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id))
      setRevokeTarget(null)
      router.refresh()
    } finally {
      setRevoking(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{keys.length} key terdaftar</p>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-[#367C2B] hover:bg-[#2d6423] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} />
            Generate API Key
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Key size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Belum ada API key. Klik &quot;Generate API Key&quot; untuk membuat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Label</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Customer</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Last Used</th>
                  <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">Created</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-900">{k.label}</td>
                    <td className="py-3 pr-4 text-gray-600">
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-1">{k.customerAccount}</span>
                      {k.customerName}
                    </td>
                    <td className="py-3 pr-4">
                      {k.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">Revoked</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(k.lastUsedAt)}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(k.createdAt)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setRevokeTarget(k)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Revoke key"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGenerate && (
        <GenerateModal
          customers={customers}
          onClose={() => setShowGenerate(false)}
          onCreated={handleCreated}
        />
      )}

      {revealedKey && (
        <KeyRevealModal apiKey={revealedKey} onClose={() => setRevealedKey(null)} />
      )}

      {revokeTarget && (
        <ConfirmModal
          title="Revoke API Key"
          message={`Key "${revokeTarget.label}" untuk ${revokeTarget.customerName} akan dihapus permanen. Aplikasi yang menggunakan key ini tidak akan bisa akses lagi.`}
          confirmLabel="Revoke"
          confirmVariant="danger"
          loading={revoking}
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </>
  )
}
