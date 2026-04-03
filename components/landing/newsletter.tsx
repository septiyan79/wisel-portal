"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState<string>("");
    return (
        <section className="bg-green-600 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-black text-white mb-3">Tetap Terhubung dengan Wisel</h2>
          <p className="text-green-100 mb-8 text-sm leading-relaxed">
            Daftarkan email Anda untuk menerima informasi produk terbaru, promo
            eksklusif, jadwal pameran pertanian, dan tips bertani dari para ahli.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda"
              className="flex-1 bg-white border-2 border-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-900 text-gray-900 placeholder-gray-400"
            />
            <button className="bg-[#052e16] hover:bg-green-900 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
              Berlangganan
            </button>
          </div>
          <p className="text-green-200 text-xs mt-3 opacity-70">
            Tidak ada spam. Berhenti berlangganan kapan saja.
          </p>
        </div>
      </section>
    );
}