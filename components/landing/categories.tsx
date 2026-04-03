import Link from "next/link";
import { CATEGORIES } from "@/data/home";

export default function Categories() {
    return (
        <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-green-600 text-xs font-bold uppercase tracking-widest mb-1">
              Katalog Produk
            </p>
            <h2 className="text-2xl font-black text-gray-900">Belanja Berdasarkan Kategori</h2>
          </div>
          <Link
            href="/produk"
            className="text-green-600 font-semibold text-sm hover:underline flex items-center gap-1"
          >
            Lihat Semua
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map(({ label, desc, icon, from, to }) => (
            <Link
              key={label}
              href="#"
              className="group relative rounded-2xl p-6 overflow-hidden hover:scale-[1.02] transition-transform duration-200 cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            >
              {/* Subtle texture */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4) 0%, transparent 50%)",
                }}
              />
              <div className="relative">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="text-white font-bold text-sm mb-1">{label}</h3>
                <p className="text-white text-xs opacity-70 leading-snug">{desc}</p>
                <div className="mt-4 flex items-center gap-1 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1 duration-200">
                  Lihat Produk →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
}