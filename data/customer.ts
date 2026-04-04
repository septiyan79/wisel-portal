import { AlertCircle, Clock, Truck, CheckCircle, XCircle, ShoppingCart, User } from "lucide-react"
import type { ElementType } from "react"

export type Order = {
  id: string
  parts: string
  qty: number
  total: string
  status: string
  date: string
  estimasi: string | null
  note: string | null
}

export type StatusConfig = {
  label: string
  badge: string
  icon: ElementType
  iconColor: string
}

export type DashboardNavItem = {
  id: string
  label: string
  icon: ElementType
  href: string
}

export const CUSTOMER = {
  name: "Budi Santoso",
  email: "budi@example.com",
  phone: "0812-3456-7890",
  company: "PT Agro Nusantara",
  address: "Jl. Raya Pertanian No. 45, Bekasi",
  joinDate: "Januari 2024",
  avatar: "B",
}

export const ORDERS: Order[] = [
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
]

export const STATUS_MAP: Record<string, StatusConfig> = {
  menunggu:   { label: "Menunggu Konfirmasi", badge: "bg-yellow-100 text-yellow-800",  icon: AlertCircle, iconColor: "text-yellow-500" },
  diproses:   { label: "Sedang Diproses",     badge: "bg-blue-100 text-blue-800",      icon: Clock,       iconColor: "text-blue-500" },
  dikirim:    { label: "Dalam Pengiriman",    badge: "bg-purple-100 text-purple-800",  icon: Truck,       iconColor: "text-purple-500" },
  selesai:    { label: "Selesai",             badge: "bg-green-100 text-green-800",    icon: CheckCircle, iconColor: "text-green-500" },
  dibatalkan: { label: "Dibatalkan",          badge: "bg-red-100 text-red-800",        icon: XCircle,     iconColor: "text-red-500" },
}

export const NAV_ITEMS: DashboardNavItem[] = [
  { id: "transactions", label: "Riwayat Transaksi", icon: ShoppingCart, href: "/transactions" },
  { id: "profile",      label: "Profil Saya",        icon: User,         href: "/profile" },
]
