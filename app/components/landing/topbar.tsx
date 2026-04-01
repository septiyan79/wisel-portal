"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface WiselUser {
  name: string;
  email: string;
  role: "customer" | "staff";
}

export default function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<WiselUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("wisel_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem("wisel_user");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("wisel_user");
    setUser(null);
    router.push("/");
  };

  return (
    <div className="bg-[#052e16] text-white text-xs px-4 py-2 flex items-center justify-between">
      <span className="hidden sm:block text-green-400 font-medium">
        🌿 Distributor Alat Pertanian & Perkebunan Terpercaya di Indonesia
      </span>

      <div className="ml-auto flex items-center gap-4">
        <Link href="/resources" className="hover:text-green-300">
          Pusat Informasi
        </Link>

        <span className="text-green-800">|</span>

        {user ? (
          <>
            <span className="text-green-400 font-semibold">
              Halo, {user.name.split(" ")[0]}
              {user.role === "staff" && (
                <span className="ml-1.5 bg-green-700 text-green-200 px-1.5 py-0.5 rounded text-[10px]">
                  Staff
                </span>
              )}
            </span>

            <span className="text-green-800">|</span>

            <button
              onClick={handleLogout}
              className="hover:text-red-400 transition-colors"
            >
              Keluar
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-green-300">
              Masuk
            </Link>

            <Link
              href="/register"
              className="rounded bg-green-500 px-3 py-1 font-semibold hover:bg-green-400"
            >
              Daftar Akun
            </Link>
          </>
        )}
      </div>
    </div>
  );
}