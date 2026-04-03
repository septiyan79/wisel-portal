import Link from "next/link";

export default function Careers() {
    return (
        <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="rounded-3xl bg-[#f0fdf4] border border-green-100 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 p-10">
            <span className="inline-block text-green-600 text-xs font-bold uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full mb-4">
              🌱 Bergabung Bersama Kami
            </span>
            <h2 className="text-3xl font-black text-gray-900 mb-4">
              Tumbuh Bersama Wisel
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Kami mencari individu bersemangat yang ingin membuat dampak nyata di
              sektor pertanian Indonesia. Di Wisel, Anda bukan hanya karyawan —
              Anda adalah bagian dari keluarga yang membangun masa depan pertanian
              bangsa.
            </p>
            <Link
              href="/karir"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
            >
              Lihat Lowongan Karir
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div
            className="md:w-72 flex items-center justify-center p-10"
            style={{ background: "linear-gradient(135deg, #16a34a, #052e16)" }}
          >
            <div className="text-center text-white">
              <div className="text-7xl mb-4">👨‍🌾</div>
              <p className="font-black text-2xl">Karir di Wisel</p>
              <p className="text-green-200 text-sm mt-2">Lowongan tersedia di 27 provinsi</p>
            </div>
          </div>
        </div>
      </section>
    );
}