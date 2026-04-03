"use client"

import { X, Package, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { CUSTOMER, NAV_ITEMS } from "@/data/customer"

interface DashboardSidebarProps {
  activeTab: string
  collapsed: boolean
  mobileOpen: boolean
  onNavSelect: (tabId: string) => void
  onMobileClose: () => void
}

export function DashboardSidebar({
  activeTab,
  collapsed,
  mobileOpen,
  onNavSelect,
  onMobileClose,
}: DashboardSidebarProps) {
  return (
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
        <button className="lg:hidden text-white/50 hover:text-white ml-auto" onClick={onMobileClose}>
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
              onClick={() => { onNavSelect(item.id); onMobileClose() }}
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
            onClick={() => signOut({ redirectTo: "/login" })}
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
  )
}
