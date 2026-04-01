"use client";

import Link from "next/link";
import { useState } from "react";

export default function StoreLocation() {

    const [locationInput, setLocationInput] = useState<string>("");

    return (
        <section className="max-w-7xl mx-auto px-4 py-16">
            <div
                className="rounded-3xl p-10 flex flex-col md:flex-row gap-10 items-center"
                style={{ background: "linear-gradient(135deg, #052e16 0%, #14532d 100%)" }}
            >
                <div className="flex-1 text-white">
                    <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">
                        Lokasi Anda
                    </p>
                    <h2 className="text-3xl font-black mb-4">
                        Temukan Cabang Wisel Terdekat
                    </h2>
                    <p className="text-green-200 mb-6 leading-relaxed">
                        Tim Wisel siap membantu melindungi investasi Anda, memberikan
                        teknologi terkini, dan memahami kebutuhan bisnis pertanian Anda.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            placeholder="Kota, provinsi, atau kode pos"
                            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-green-400 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <button className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap">
                            Cari Cabang
                        </button>
                    </div>

                    <p className="text-green-500 text-xs mt-4">
                        📍{" "}
                        <span className="text-green-300 font-semibold">120+ cabang</span> di{" "}
                        <span className="text-green-300 font-semibold">27 provinsi</span> seluruh
                        Indonesia
                    </p>
                </div>

                {/* Mock location list */}
                <div className="w-full md:w-72 bg-white/5 rounded-2xl border border-green-800 overflow-hidden">
                    <div className="px-5 py-3 border-b border-green-900">
                        <p className="text-green-300 text-sm font-bold">Cabang Terdekat</p>
                    </div>
                    {[
                        { city: "Jakarta Selatan", type: "Showroom + Servis" },
                        { city: "Surabaya, Jawa Timur", type: "Showroom + Gudang" },
                        { city: "Medan, Sumatera Utara", type: "Showroom + Servis" },
                        { city: "Makassar, Sulawesi Sel.", type: "Agen Resmi" },
                    ].map(({ city, type }) => (
                        <div
                            key={city}
                            className="px-5 py-3 border-b border-green-900 border-opacity-50 flex items-center justify-between hover:bg-green-900 hover:bg-opacity-30 transition-colors"
                        >
                            <div>
                                <p className="text-white text-sm font-semibold">{city}</p>
                                <p className="text-green-500 text-xs">{type}</p>
                            </div>
                            <Link href="#" className="text-green-400 text-xs font-semibold hover:underline">
                                Lihat →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}