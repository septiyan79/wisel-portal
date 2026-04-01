import Link from "next/link";

export default function Banner() {
    return (
        <section className="bg-linear-to-r from-[#052e16] to-[#14532d] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Akun Wisel
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            Wisel Hadir Kapan &amp; Di Mana Anda Butuhkan
          </h2>
          <p className="text-green-300 mb-8 text-base leading-relaxed">
            Akses informasi stok, riwayat pembelian, jadwal servis, dan penawaran
            eksklusif langsung dari akun Wisel Anda — di sawah atau di kantor.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-8 rounded-xl transition-colors text-sm shadow-lg shadow-green-900"
          >
            Buat Akun Saya
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>
    );
}