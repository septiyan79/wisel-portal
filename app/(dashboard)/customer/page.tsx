"use client"

import { useState } from "react"
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar"
import { OrdersTab } from "@/components/dashboard/OrdersTab"
import { ProfileTab } from "@/components/dashboard/ProfileTab"

const TAB_TITLES: Record<string, string> = {
  orders:  "Riwayat Order",
  profile: "Profil Saya",
}

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("orders")

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <DashboardNavbar activeTab={activeTab} onNavSelect={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Page title */}
        <div className="mb-5">
          <h1 className="text-xl font-black text-gray-900">{TAB_TITLES[activeTab]}</h1>
          <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
        </div>

        {activeTab === "orders"  && <OrdersTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>
    </div>
  )
}
