import Link from "next/link";
import { HERO_TABS, BRANDS, STATS } from "@/data/home";

export default function Hero() {
    return (
        <section className="relative flex min-h-135 items-center overflow-hidden bg-[#052e16]">

        {/* Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_60%,rgba(22,163,74,0.35),transparent_55%),radial-gradient(ellipse_at_85%_20%,rgba(134,239,172,0.15),transparent_45%)]" />

        {/* Grid */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-size-[40px_40px]" />


        <div className="relative max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left content */}
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Distributor Resmi Alat Pertanian Indonesia
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight mb-5">
                Solusi Alat Tani &amp;{" "}
                <span className="text-green-400">Perkebunan</span>
                <br />
                Terlengkap di Indonesia
              </h1>
              <p className="text-green-200 text-lg mb-8 max-w-lg leading-relaxed">
                Dari traktor hingga drone pertanian — kami hadir untuk mendukung
                produktivitas lahan Anda setiap musim tanam.
              </p>

              {/* CTA Tabs */}
              <div className="flex flex-wrap gap-3">
                {HERO_TABS.map(({ label, icon, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-2 bg-white/10 hover:bg-green-600 border border-white/20 hover:border-green-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all backdrop-blur-sm"
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                ))}
              </div>

              {/* Brand strip */}
              <div className="mt-10">
                <p className="text-green-600 text-xs font-bold uppercase tracking-widest mb-3">
                  Merek Resmi yang Kami Distribusikan
                </p>
                <div className="flex flex-wrap gap-2">
                  {BRANDS.map((b) => (
                    <span
                      key={b}
                      className="bg-white/10 border border-white/10 text-green-200 text-xs font-semibold px-3 py-1.5 rounded-lg"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
                >
                  <div className="text-4xl font-black text-green-400">{value}</div>
                  <div className="text-green-300 text-sm mt-1 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
}