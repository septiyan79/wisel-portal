"use client";

import { useState } from "react";
import {
  User, ShoppingCart, LogOut, Bell, Menu, X,
  ChevronRight, Clock, CheckCircle, XCircle, Truck,
  AlertCircle, Eye, PanelLeftClose, PanelLeftOpen,
  Package, MapPin, Phone, Mail, Building2, Edit2,
  Save, ChevronDown,
} from "lucide-react";

// ── DUMMY DATA ────────────────────────────────────────────────
const CUSTOMER = {
  name: "Budi Santoso",
  email: "budi@example.com",
  phone: "0812-3456-7890",
  company: "PT Agro Nusantara",
  address: "Jl. Raya Pertanian No. 45, Bekasi",
  joinDate: "Januari 2024",
  avatar: "B",
};

const ORDERS = [
  {
    id: "ORD-2025-128",
    parts: "Filter Oli Mesin — RE504836",
    qty: 10,
    total: "Rp 2.400.000",
    status: "dikirim",
    date: "28 Mar 2025",
    estimasi: "30–31 Mar 2025",
    note: "Dikirim via JNE, no resi: JD9182736",
  },
  {
    id: "ORD-2025-121",
    parts: "V-Belt Set — M152284",
    qty: 2,
    total: "Rp 890.000",
    status: "selesai",
    date: "20 Mar 2025",
    estimasi: null,
    note: "Diterima dengan baik",
  },
  {
    id: "ORD-2025-115",
    parts: "Hydraulic Seal Kit — AH215688",
    qty: 1,
    total: "Rp 1.250.000",
    status: "selesai",
    date: "12 Mar 2025",
    estimasi: null,
    note: null,
  },
  {
    id: "ORD-2025-108",
    parts: "Air Filter Primer — RE62687",
    qty: 5,
    total: "Rp 750.000",
    status: "selesai",
    date: "5 Mar 2025",
    estimasi: null,
    note: null,
  },
  {
    id: "ORD-2025-099",
    parts: "Fuel Filter — RE522879",
    qty: 3,
    total: "Rp 621.000",
    status: "dibatalkan",
    date: "25 Feb 2025",
    estimasi: null,
    note: "Dibatalkan atas permintaan customer",
  },
  {
    id: "ORD-2025-087",
    parts: "Oli Transmisi — TY22061",
    qty: 4,
    total: "Rp 1.280.000",
    status: "selesai",
    date: "14 Feb 2025",
    estimasi: null,
    note: null,
  },
];

const STATUS_MAP: Record<string, { label: string; badge: string; icon: React.ElementType; iconColor: string }> = {
  menunggu:   { label: "Menunggu Konfirmasi", badge: "bg-yellow-100 text-yellow-800", icon: AlertCircle, iconColor: "text-yellow-500" },
  diproses:   { label: "Sedang Diproses",     badge: "bg-blue-100 text-blue-800",    icon: Clock,       iconColor: "text-blue-500" },
  dikirim:    { label: "Dalam Pengiriman",    badge: "bg-purple-100 text-purple-800", icon: Truck,       iconColor: "text-purple-500" },
  selesai:    { label: "Selesai",             badge: "bg-green-100 text-green-800",  icon: CheckCircle, iconColor: "text-green-500" },
  dibatalkan: { label: "Dibatalkan",          badge: "bg-red-100 text-red-800",      icon: XCircle,     iconColor: "text-red-500" },
};

const NAV_ITEMS = [
  { id: "orders",  label: "Riwayat Order", icon: ShoppingCart },
  { id: "profile", label: "Profil Saya",   icon: User },
];

// ── STATUS BADGE ──────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP["menunggu"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.badge}`}>
      <s.icon size={11} />
      {s.label}
    </span>
  );
}

// ── ORDER DETAIL MODAL ────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
}: {
  order: (typeof ORDERS)[0];
  onClose: () => void;
}) {
  const s = STATUS_MAP[order.status];
  const StatusIcon = s.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 font-[Plus_Jakarta_Sans,Segoe_UI,sans-serif]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Detail Order</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Status banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            order.status === "selesai"    ? "bg-green-50"  :
            order.status === "dikirim"    ? "bg-purple-50" :
            order.status === "dibatalkan" ? "bg-red-50"    : "bg-blue-50"
          }`}>
            <StatusIcon size={20} className={s.iconColor} />
            <div>
              <p className={`text-sm font-bold ${s.iconColor}`}>{s.label}</p>
              {order.note && (
                <p className="text-xs text-gray-500 mt-0.5">{order.note}</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            {[
              { label: "Order ID",   value: order.id,    mono: true },
              { label: "Tanggal",    value: order.date,  mono: false },
              { label: "Parts",      value: order.parts, mono: false },
              { label: "Jumlah",     value: `${order.qty} pcs`, mono: false },
              { label: "Total",      value: order.total, mono: false },
              ...(order.estimasi ? [{ label: "Estimasi tiba", value: order.estimasi, mono: false }] : []),
            ].map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-4">
                <span className="text-xs text-gray-500 flex-shrink-0 w-28">{row.label}</span>
                <span className={`text-xs font-semibold text-gray-900 text-right ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Tombol aksi */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
            {order.status === "selesai" && (
              <button className="flex-1 py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors">
                Pesan Lagi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ORDERS TAB ────────────────────────────────────────────────
function OrdersTab() {
  const [filterStatus, setFilterStatus] = useState("semua");
  const [selectedOrder, setSelectedOrder] = useState<(typeof ORDERS)[0] | null>(null);

  const filtered = ORDERS.filter(
    (o) => filterStatus === "semua" || o.status === filterStatus
  );

  // Hitung order aktif (belum selesai/batal)
  const activeOrders = ORDERS.filter(
    (o) => o.status !== "selesai" && o.status !== "dibatalkan"
  );

  return (
    <div className="space-y-5">
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Banner order aktif */}
      {activeOrders.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck size={18} className="text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-purple-900">
              {activeOrders.length} order sedang dalam proses
            </p>
            <p className="text-xs text-purple-600 mt-0.5 truncate">
              {activeOrders[0].parts}
            </p>
          </div>
          <button
            onClick={() => setSelectedOrder(activeOrders[0])}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 flex-shrink-0"
          >
            Lihat <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* Stat ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Order",    value: ORDERS.length,                                               color: "text-gray-900",   bg: "bg-gray-50" },
          { label: "Dalam Proses",   value: ORDERS.filter(o => !["selesai","dibatalkan"].includes(o.status)).length, color: "text-purple-700", bg: "bg-purple-50" },
          { label: "Selesai",        value: ORDERS.filter(o => o.status === "selesai").length,           color: "text-green-700",  bg: "bg-green-50" },
          { label: "Dibatalkan",     value: ORDERS.filter(o => o.status === "dibatalkan").length,        color: "text-red-600",    bg: "bg-red-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "semua",     label: "Semua" },
          { value: "dikirim",   label: "Dikirim" },
          { value: "diproses",  label: "Diproses" },
          { value: "menunggu",  label: "Menunggu" },
          { value: "selesai",   label: "Selesai" },
          { value: "dibatalkan",label: "Dibatalkan" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterStatus(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === f.value
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabel order */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Parts</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Qty</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Total</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Tanggal</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Tidak ada order dengan status ini</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Order ID */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-xs font-mono text-gray-500">{order.id}</p>
                    </td>

                    {/* Parts */}
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
                        {order.parts}
                      </p>
                      {/* Estimasi pengiriman — tampil di bawah nama parts jika ada */}
                      {order.estimasi && (
                        <p className="text-xs text-purple-600 mt-0.5 whitespace-nowrap">
                          Tiba: {order.estimasi}
                        </p>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="px-5 py-4 text-sm text-gray-600 hidden sm:table-cell">
                      {order.qty} pcs
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4 font-bold text-gray-900 hidden md:table-cell whitespace-nowrap">
                      {order.total}
                    </td>

                    {/* Tanggal */}
                    <td className="px-5 py-4 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">
                      {order.date}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat detail"
                        >
                          <Eye size={14} />
                        </button>
                        {order.status === "selesai" && (
                          <button
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Pesan lagi"
                          >
                            <ShoppingCart size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer tabel */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
          <p className="text-xs text-gray-400">{filtered.length} order ditampilkan</p>
          <div className="flex items-center gap-1">
            {[1, 2].map((n) => (
              <button
                key={n}
                className={`w-7 h-7 text-xs rounded-lg font-semibold transition-colors ${
                  n === 1
                    ? "bg-green-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROFILE TAB ───────────────────────────────────────────────
function ProfileTab() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(CUSTOMER);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

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
  );
}

// ── MAIN CUSTOMER DASHBOARD ───────────────────────────────────
export default function CustomerDashboard() {
  const [activeTab, setActiveTab]   = useState("orders");
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const TAB_TITLES: Record<string, string> = {
    orders:  "Riwayat Order",
    profile: "Profil Saya",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 h-full bg-[#052e16] z-30
        flex flex-col overflow-hidden
        transition-all duration-200 ease-in-out
        ${mobileOpen ? "translate-x-0 w-60" : "-translate-x-full w-60"}
        lg:translate-x-0 ${collapsed ? "lg:w-16" : "lg:w-60"}
      `}>

        {/* Logo */}
        <div className={`flex items-center border-b border-white/10 flex-shrink-0 h-16 ${collapsed ? "lg:justify-center px-5 lg:px-0" : "px-5 gap-3"}`}>
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">W</span>
          </div>
          <div className={`flex-1 min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-white text-sm font-bold leading-none">Wisel</p>
            <p className="text-green-400 text-xs mt-0.5">Dashboard Saya</p>
          </div>
          <button className="lg:hidden text-white/50 hover:text-white ml-auto" onClick={() => setMobileOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Greeting user */}
        <div className={`px-4 py-4 border-b border-white/10 ${collapsed ? "lg:hidden" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-500/25 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-300 font-bold text-sm">{CUSTOMER.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{CUSTOMER.name}</p>
              <p className="text-green-400 text-xs truncate">{CUSTOMER.company}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <div key={item.id} className="relative group">
              <button
                onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`
                  w-full flex items-center rounded-xl text-sm font-medium transition-colors
                  ${collapsed ? "lg:justify-center lg:px-0 lg:py-3 px-3 py-2.5 gap-3" : "gap-3 px-3 py-2.5"}
                  ${activeTab === item.id
                    ? "bg-green-500/20 text-white"
                    : "text-green-200/70 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <item.icon size={18} className="flex-shrink-0" />
                <span className={`${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
              </button>

              {/* Tooltip saat collapsed */}
              {collapsed && (
                <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
                  bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg
                  opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </div>
          ))}

          {/* Divider + link ke katalog */}
          <div className={`pt-3 mt-3 border-t border-white/10 ${collapsed ? "lg:hidden" : ""}`}>
            <a
              href="/catalog"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-green-200/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Package size={18} className="flex-shrink-0" />
              Katalog Parts
            </a>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-white/10 flex-shrink-0">
          <div className="relative group">
            <button
              onClick={() => { localStorage.removeItem("wisel_user"); window.location.href = "/"; }}
              className={`w-full flex items-center rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors py-2 px-2 gap-2
                ${collapsed ? "lg:justify-center" : ""}`}
            >
              <LogOut size={14} className="flex-shrink-0" />
              <span className={`${collapsed ? "lg:hidden" : ""}`}>Keluar</span>
            </button>
            {collapsed && (
              <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
                bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg
                opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                Keluar
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={`
        flex-1 flex flex-col min-h-screen transition-all duration-200
        ${collapsed ? "lg:ml-16" : "lg:ml-60"}
      `}>

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 sticky top-0 z-10 h-16">
          <button
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors flex-shrink-0"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setCollapsed((prev) => !prev);
              } else {
                setMobileOpen(true);
              }
            }}
          >
            <span className="hidden lg:block">
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </span>
            <span className="lg:hidden"><Menu size={20} /></span>
          </button>

          <div>
            <h1 className="text-base font-bold text-gray-900">{TAB_TITLES[activeTab]}</h1>
            <p className="text-xs text-gray-400">Halo, {CUSTOMER.name.split(" ")[0]} 👋</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={18} />
            </button>
            <a
              href="/catalog"
              className="hidden sm:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
            >
              <ShoppingCart size={14} /> Order Parts
            </a>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-5">
          {activeTab === "orders"  && <OrdersTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </main>
    </div>
  );
}
