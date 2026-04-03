"use client"

import { Bell, ShoppingCart, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { CUSTOMER } from "@/data/customer"

const TAB_TITLES: Record<string, string> = {
  orders:  "Riwayat Order",
  profile: "Profil Saya",
}

interface DashboardHeaderProps {
  activeTab: string
  collapsed: boolean
  onToggleSidebar: () => void
  onOpenMobile: () => void
}

export function DashboardHeader({
  activeTab,
  collapsed,
  onToggleSidebar,
  onOpenMobile,
}: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-3 sticky top-0 z-10 h-16">
      <button
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors flex-shrink-0"
        onClick={onToggleSidebar}
      >
        <span className="hidden lg:block">
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </span>
        <span className="lg:hidden" onClick={(e) => { e.stopPropagation(); onOpenMobile() }}>
          <Menu size={20} />
        </span>
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
  )
}
