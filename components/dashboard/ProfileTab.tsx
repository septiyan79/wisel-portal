"use client"

import { useState } from "react"
import { User, Building2, Save, CheckCircle } from "lucide-react"

interface ProfileTabProps {
  customerAccount: string
  customerName: string
  role: string
}

export function ProfileTab({ customerAccount, customerName, role }: ProfileTabProps) {
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle size={15} />
          Profile saved successfully
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
        <div className="space-y-3">
          {["Current Password", "New Password", "Confirm New Password"].map((label) => (
            <div key={label}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          className="mt-4 flex items-center gap-2 bg-[#367C2B] hover:bg-[#2d6423] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Save size={14} /> Change Password
        </button>
      </div>
    </div>
  )
}
