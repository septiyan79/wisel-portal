import Link from "next/link";
import { RESOURCES } from "@/data/home";

export default function Resources() {
    return (
        <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-green-600 text-xs font-bold uppercase tracking-widest mb-1">
                Edukasi &amp; Informasi
              </p>
              <h2 className="text-2xl font-black text-gray-900">Pusat Informasi Wisel</h2>
            </div>
            <Link
              href="/resources"
              className="text-green-600 font-semibold text-sm hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Filter chips */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {[
              { icon: "🎙️", label: "Podcast" },
              { icon: "▶️", label: "Video" },
              { icon: "📝", label: "Blog" },
              { icon: "📚", label: "Panduan" },
            ].map(({ icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-700 px-4 py-2 rounded-full text-sm font-semibold text-gray-600 transition-all"
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {RESOURCES.map(({ tag, type, icon, title, desc, cta, accent, tagColor }) => (
              <div
                key={title}
                className={`border ${accent} rounded-2xl p-6 flex flex-col hover:shadow-md transition-all group`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tagColor}`}>
                    {tag}
                  </span>
                  <span className="text-xs text-gray-400">{type}</span>
                </div>
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-900 leading-snug mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{desc}</p>
                <Link
                  href="#"
                  className="mt-5 text-green-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  {cta}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
}