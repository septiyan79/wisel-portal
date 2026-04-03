"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { OrdersTab } from "@/components/dashboard/OrdersTab"
import { ProfileTab } from "@/components/dashboard/ProfileTab"

export default function CustomerDashboard() {
  const [activeTab, setActiveTab]   = useState("orders")
  const [collapsed, setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setCollapsed((prev) => !prev)
    } else {
      setMobileOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <DashboardSidebar
        activeTab={activeTab}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavSelect={setActiveTab}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${collapsed ? "lg:ml-16" : "lg:ml-60"}`}>
        <DashboardHeader
          activeTab={activeTab}
          collapsed={collapsed}
          onToggleSidebar={handleToggleSidebar}
          onOpenMobile={() => setMobileOpen(true)}
        />

        <div className="flex-1 p-5">
          {activeTab === "orders"  && <OrdersTab />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </main>
    </div>
  )
}
