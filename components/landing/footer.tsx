import Link from "next/link";
import { FOOTER_LINKS } from "@/data/footer";

export default function Footer(){
    return(
        <footer className="bg-[#030f05] text-gray-400 pt-14 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-green-950">
            {/* Brand col */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-green-600 rounded-xl w-9 h-9 flex items-center justify-center">
                  <span className="text-white font-black text-base">W</span>
                </div>
                <div>
                  <span className="font-black text-xl text-green-400 tracking-tight">wisel</span>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                    Agri Equipment
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-5">
                Distributor alat pertanian &amp; perkebunan terpercaya di Indonesia sejak 2009.
              </p>
              <div className="flex gap-2 flex-wrap">
                {["FB", "IG", "YT", "TW", "TT", "WA"].map((s) => (
                  <Link
                    key={s}
                    href="#"
                    className="w-8 h-8 bg-green-950 hover:bg-green-600 text-gray-400 hover:text-white rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>

            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-white font-bold text-sm mb-4">{heading}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-xs text-gray-500 hover:text-green-400 transition-colors"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-6 gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Wisel Agri Equipment. Hak cipta dilindungi undang-undang.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {[
                "Kebijakan Privasi",
                "Syarat & Ketentuan",
                "Kebijakan Pengembalian",
                "Hak Perbaikan",
              ].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="text-xs text-gray-600 hover:text-green-400 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
}