"use client"

import { useState } from "react"
import { User, Mail, Phone, Building2, MapPin, Edit2, Save, CheckCircle } from "lucide-react"
import { CUSTOMER } from "@/data/customer"

export function ProfileTab() {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(CUSTOMER)
  const [saved, setSaved]     = useState(false)

  const handleSave = () => {
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Toast sukses simpan */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle size={15} />
          Profil berhasil disimpan
        </div>
      )}

      {/* Avatar + nama */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-green-700 text-2xl font-black">{form.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-gray-900">{form.name}</p>
          <p className="text-sm text-gray-500">{form.company}</p>
          <p className="text-xs text-gray-400 mt-1">Bergabung sejak {form.joinDate}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors flex-shrink-0 ${
            editing
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          }`}
        >
          <Edit2 size={14} />
          {editing ? "Batal" : "Edit Profil"}
        </button>
      </div>

      {/* Form data */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5 text-sm">Informasi Akun</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { field: "name",    label: "Nama Lengkap", icon: User,      type: "text" },
            { field: "email",   label: "Email",        icon: Mail,      type: "email" },
            { field: "phone",   label: "No. Telepon",  icon: Phone,     type: "tel" },
            { field: "company", label: "Perusahaan",   icon: Building2, type: "text" },
          ].map(({ field, label, icon: Icon, type }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  disabled={!editing}
                  className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border transition-all ${
                    editing
                      ? "border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                      : "border-transparent bg-gray-50 text-gray-700 cursor-default"
                  }`}
                />
              </div>
            </div>
          ))}

          {/* Alamat — full width */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Alamat Pengiriman</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                disabled={!editing}
                rows={2}
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border transition-all resize-none ${
                  editing
                    ? "border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                    : "border-transparent bg-gray-50 text-gray-700 cursor-default"
                }`}
              />
            </div>
          </div>
        </div>

        {editing && (
          <button
            onClick={handleSave}
            className="mt-5 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <Save size={14} /> Simpan Perubahan
          </button>
        )}
      </div>

      {/* Ganti password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 text-sm">Keamanan Akun</h3>
        <div className="space-y-3">
          {["Password Saat Ini", "Password Baru", "Konfirmasi Password Baru"].map((label) => (
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
        <button className="mt-4 text-sm font-bold text-green-600 hover:text-green-700 transition-colors">
          Ubah Password
        </button>
      </div>
    </div>
  )
}
