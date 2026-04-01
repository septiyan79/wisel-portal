"use client";

import Link from "next/link";
import { NAV_ITEMS } from "@/data/home";
import { useState, useEffect } from "react";

export default function Header() {

    const [menuOpen, setMenuOpen] = useState<boolean>(false);
    const [activeNav, setActiveNav] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState<boolean>(false);
    const [scrolled, setScrolled] = useState<boolean>(false);

    
      useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
      }, []);
    

    return (
        <header
            className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? "shadow-lg" : "border-b border-gray-100"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 shrink-0">
                    <div className="bg-green-600 rounded-xl w-9 h-9 flex items-center justify-center shadow-md">
                        <span className="text-white font-black text-base tracking-tight">W</span>
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-xl text-green-700 tracking-tight">wisel</span>
                        <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                            Agri Equipment
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                    {NAV_ITEMS.map((item) => (
                        <div
                            key={item.label}
                            className="relative"
                            onMouseEnter={() => setActiveNav(item.label)}
                            onMouseLeave={() => setActiveNav(null)}
                        >
                            <button className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-green-700 flex items-center gap-1 rounded-lg hover:bg-green-50 transition-all">
                                {item.label}
                                <svg
                                    className="w-3 h-3 opacity-50"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* Dropdown */}
                            <div
                                className={`absolute top-full left-0 bg-white shadow-2xl border border-gray-100 rounded-2xl min-w-55 py-2 mt-1 transition-all duration-200 ${activeNav === item.label
                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 -translate-y-2 pointer-events-none"
                                    }`}
                            >
                                <div className="px-3 pb-2 mb-1 border-b border-gray-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">
                                        {item.label}
                                    </p>
                                </div>
                                {item.sub.map((s) => (
                                    <Link
                                        key={s}
                                        href="#"
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 font-medium transition-colors mx-1 rounded-xl"
                                    >
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full opacity-60" />
                                        {s}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </button>

                    <button className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all relative">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            0
                        </span>
                    </button>

                    <Link
                        href="/cabang"
                        className="hidden md:flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        Cari Cabang
                    </Link>

                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="lg:hidden p-2 text-gray-600 hover:text-green-700 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            {searchOpen && (
                <div className="border-t border-gray-100 bg-green-50 px-4 py-3">
                    <div className="mx-auto flex max-w-2xl gap-2">
                        <input
                            className="flex-1 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Cari part ..."
                            autoFocus
                        />
                        <button className="rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
                            Cari
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-100 px-4 pb-4 max-h-[70vh] overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <div key={item.label} className="py-3 border-b border-gray-50">
                            <p className="text-sm font-bold text-gray-800 mb-2">{item.label}</p>
                            <div className="grid grid-cols-2 gap-1 pl-2">
                                {item.sub.map((s) => (
                                    <Link
                                        key={s}
                                        href="#"
                                        className="text-xs text-gray-500 py-1.5 hover:text-green-700 font-medium"
                                    >
                                        {s}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </header>
    );
}