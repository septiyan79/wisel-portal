import { AlertCircle, Clock, Truck, CheckCircle, XCircle, ShoppingCart, Cpu, LayoutDashboard } from "lucide-react"
import type { ElementType } from "react"

export type StatusConfig = {
  label: string
  badge: string
  icon: ElementType
  iconColor: string
}

export type DashboardNavChild = {
  id: string
  label: string
  href: string
}

export type DashboardNavItem = {
  id: string
  label: string
  icon: ElementType
  href: string
  children?: DashboardNavChild[]
}


export const STATUS_MAP: Record<string, StatusConfig> = {
  menunggu:   { label: "Pending Confirmation", badge: "bg-yellow-100 text-yellow-800",  icon: AlertCircle, iconColor: "text-yellow-500" },
  diproses:   { label: "Processing",          badge: "bg-blue-100 text-blue-800",      icon: Clock,       iconColor: "text-blue-500" },
  dikirim:    { label: "In Transit",          badge: "bg-purple-100 text-purple-800",  icon: Truck,       iconColor: "text-purple-500" },
  selesai:    { label: "Completed",           badge: "bg-green-100 text-green-800",    icon: CheckCircle, iconColor: "text-green-500" },
  dibatalkan: { label: "Cancelled",           badge: "bg-red-100 text-red-800",        icon: XCircle,     iconColor: "text-red-500" },
}

const TRANSACTION_CHILDREN: DashboardNavChild[] = [
  { id: "all",       label: "All Transactions",      href: "/transactions" },
  { id: "stock",     label: "Stock",                 href: "/transactions/stock" },
  { id: "by-fleet",  label: "By Fleet Number",       href: "/transactions/by-fleet" },
  { id: "by-part",   label: "By Part Number",        href: "/transactions/by-part" },
  { id: "summary",   label: "Transaction Summary",   href: "/transactions/summary" },
]

export const NAV_ITEMS: DashboardNavItem[] = [
  { id: "dashboard",    label: "Dashboard",  icon: LayoutDashboard, href: "/dashboard" },
  { id: "transactions", label: "Transactions",  icon: ShoppingCart,    href: "/transactions", children: TRANSACTION_CHILDREN },
]

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  { id: "dashboard",    label: "Dashboard",  icon: LayoutDashboard, href: "/dashboard" },
  { id: "transactions", label: "Transactions",  icon: ShoppingCart,    href: "/transactions", children: TRANSACTION_CHILDREN },
  { id: "units",        label: "Units", icon: Cpu,             href: "/units" },
]
