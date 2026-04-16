"use client"

import { Bell, LogOut, ShoppingCart, Settings, HelpCircle, ChevronDown, Menu, X } from "lucide-react"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/data/customer"
import { ConfirmModal } from "./ConfirmModal"

interface DashboardNavbarProps {
  customerAccount: string
  customerName: string
  role: string
}

export function DashboardNavbar({ customerAccount, customerName, role }: DashboardNavbarProps) {
  const pathname = usePathname()
  const navItems = role === "customer" ? NAV_ITEMS : ADMIN_NAV_ITEMS
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [navSlideOpen, setNavSlideOpen] = useState(false)
  const [secondarySlideOpen, setSecondarySlideOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initial = (customerName || customerAccount || "?").charAt(0).toUpperCase()

  return (
    <>
      {confirmLogout && (
        <ConfirmModal
          title="Keluar dari akun?"
          message="Kamu akan keluar dari sesi ini dan diarahkan ke halaman login."
          confirmLabel="Ya, Keluar"
          confirmVariant="warning"
          onConfirm={() => signOut({ redirectTo: "/login" })}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      {/* ── Nav slide-in sidebar (top bar menu, mobile) ── */}
      {navSlideOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setNavSlideOpen(false)} />
      )}
      <div className={`
        fixed top-0 right-0 h-full w-64 bg-white z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out md:hidden
        ${navSlideOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 py-3 bg-[#367C2B]">
          <span className="text-white font-bold text-sm">Menu</span>
          <button onClick={() => setNavSlideOpen(false)} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#367C2B] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-black">{initial}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{customerName}</p>
            <p className="text-xs text-gray-500">{customerAccount}</p>
          </div>
        </div>

        <nav className="px-3 py-3 space-y-0.5 border-b border-gray-100">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setNavSlideOpen(false)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-[#367C2B]/10 text-[#367C2B]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-3 space-y-0.5">
          <Link
            href="/profile"
            onClick={() => setNavSlideOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings size={16} />
            Profil Saya
          </Link>
          <button
            onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </div>

      {/* ── Secondary slide-in sidebar (help & settings, mobile) ── */}
      {secondarySlideOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSecondarySlideOpen(false)} />
      )}
      <div className={`
        fixed top-0 right-0 h-full w-64 bg-[#2d2d2d] z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out md:hidden
        ${secondarySlideOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a]">
          <span className="text-white font-bold text-sm">Options</span>
          <button onClick={() => setSecondarySlideOpen(false)} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-3 py-3 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors">
            <HelpCircle size={16} />
            Help
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors">
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* ── Main header ── */}
      <header className="sticky top-0 z-30 shadow-md font-(--font-barlow)">

        {/* ── Top bar ── */}
        <div className="bg-white">
          <div className="flex items-center h-14 md:h-20 pr-4 md:pr-6">

            {/* Green-yellow vertical accent + John Deere logo */}
            <div className="flex items-center self-stretch gap-6 md:gap-8 w-44 md:w-60 shrink-0">
              <div className="flex self-stretch shrink-0">
                <div className="w-3 md:w-4 bg-[#367C2B]" />
                <div className="w-1 md:w-1.5 bg-[#FFDE00]" />
              </div>
              <Image
                src="/John Deere Logo.png"
                alt="John Deere"
                width={160}
                height={36}
                className="h-8 md:h-11 w-auto object-contain"
                priority
              />
            </div>

            {/* Desktop nav tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                    pathname.startsWith(item.href)
                      ? "border-[#367C2B] text-[#367C2B]"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-1 md:gap-2">

              {/* Desktop: Bell + User menu */}
              <button className="hidden md:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
                <Bell size={17} />
              </button>

              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-[#367C2B] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-black">{initial}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{customerName || customerAccount}</span>
                  <ChevronDown size={13} className="text-gray-400" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded shadow-lg z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900">{customerName}</p>
                        <p className="text-xs text-gray-500">{customerAccount}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={14} />
                        Profil Saya
                      </Link>
                      <button
                        onClick={() => setConfirmLogout(true)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile: 3-bars for top bar menu */}
              <button
                className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                onClick={() => setNavSlideOpen(true)}
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Secondary bar ── */}
        <div className="bg-[#3d3d3d] px-4 md:px-6 py-2.5 md:py-4 flex items-center gap-4">

          {/* New Part Search — mobile left */}
          <button className="md:hidden flex items-center gap-2 border-0 md:border-2 border-white text-white text-sm font-semibold px-3 py-1 hover:bg-white/10 transition-colors">
            <ShoppingCart size={14} />
            New Part Search
          </button>

          {/* Spacer: logo container (w-60) + stripe (22px) + ml-8 (32px) - px-6 (24px) = ~270px */}
          <div className="hidden md:block w-14 shrink-0" />

          {/* Text aligned with nav items */}
          <p className="hidden md:block text-white/80 text-sm font-semibold tracking-widest uppercase">
            PT Wahana Inti Selaras
          </p>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1">

            {/* New Part Search — desktop right */}
            <button className="hidden md:flex items-center gap-2 border-2 border-white text-white text-sm font-semibold px-5 py-2 hover:bg-white/10 transition-colors">
              <ShoppingCart size={14} />
              New Part Search
            </button>

            {/* Cart — always visible */}
            <button className="relative flex items-center px-3 md:px-4 py-1 text-gray-300 hover:text-white transition-colors">
              <ShoppingCart size={18} className="md:hidden" />
              <ShoppingCart size={22} className="hidden md:block" />
              <span className="absolute -top-0.5 right-1 w-4 h-4 bg-[#FFDE00] text-[#3d3d3d] text-[9px] font-black rounded-full flex items-center justify-center">0</span>
            </button>

            {/* Help + Settings — desktop only */}
            <button className="hidden md:flex items-center px-4 py-1 text-gray-300 hover:text-white transition-colors">
              <HelpCircle size={22} />
            </button>
            <button className="hidden md:flex items-center px-4 py-1 text-gray-300 hover:text-white transition-colors">
              <Settings size={22} />
            </button>

            {/* 3-bars for secondary menu — mobile only */}
            <button
              className="md:hidden flex items-center px-3 py-1 text-gray-300 hover:text-white transition-colors"
              onClick={() => setSecondarySlideOpen(true)}
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
