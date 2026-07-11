"use client"

import { useState } from "react"
import { User, Building2, Save, CheckCircle, Loader2 } from "lucide-react"

interface ProfileTabProps {
  customerAccount: string
  customerName: string
  role: string
}

export function ProfileTab({ customerAccount, customerName, role }: ProfileTabProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to change password"); return }
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle size={15} />
          Password changed successfully
        </div>
      )}

      {/* Avatar + nama */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
          <span className="text-green-700 text-2xl font-black">{customerName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-gray-900">{customerName}</p>
          <p className="text-sm text-gray-500">{customerAccount}</p>
          <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            role === "admin"
              ? "bg-purple-100 text-purple-700"
              : "bg-green-100 text-green-700"
          }`}>
            {role === "admin" ? "Admin" : "Customer"}
          </span>
        </div>
      </div>

      {/* Informasi akun */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5 text-sm">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Customer Name</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                defaultValue={customerName}
                disabled
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-transparent bg-gray-50 text-gray-700 cursor-default"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Account Number</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customerAccount}
                disabled
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-transparent bg-gray-50 text-gray-500 cursor-default font-mono tracking-widest"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ganti password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 text-sm">Account Security</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#367C2B] hover:bg-[#2d6423] disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  )
}
