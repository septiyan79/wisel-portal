// =============================================================
// FILE: app/login/page.tsx
// Halaman login untuk customer / end user
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Leaf, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Kalau sudah login, langsung redirect ke landing page
  useEffect(() => {
    const user = localStorage.getItem("wisel_user");
    if (user) router.replace("/");
  }, [router]);

  // ── DUMMY LOGIN ─────────────────────────────────────────────
  // Nanti bagian ini diganti dengan NextAuth signIn("deere")
  // saat credentials John Deere sudah tersedia
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulasi network delay
    await new Promise((r) => setTimeout(r, 1200));

    // Dummy validation — ganti dengan auth asli nanti
    if (email === "user@wisel.co.id" && password === "password123") {
      localStorage.setItem(
        "wisel_user",
        JSON.stringify({
          name: "Budi Santoso",
          email: email,
          role: "customer",
        })
      );
      router.push("/");
    } else {
      setError("Email atau password salah. Coba: user@wisel.co.id / password123");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Back to home */}
      <div className="p-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Kembali ke Beranda
        </a>
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 rounded-xl mb-4">
              <Leaf size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Masuk ke Wisel</h1>
            <p className="text-sm text-gray-500 mt-1">
              Belum punya akun?{" "}
              <a href="/register" className="text-green-600 hover:text-green-700 font-semibold">
                Daftar sekarang
              </a>
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <a href="/forgot-password" className="text-xs text-green-600 hover:text-green-700">
                    Lupa password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2.5 rounded-lg transition-colors text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">atau masuk dengan</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* John Deere SSO — aktifkan nanti saat credentials tersedia */}
            <button
              disabled
              className="w-full flex items-center justify-center gap-2.5 border border-gray-200 bg-gray-50 text-gray-400 text-sm font-semibold py-2.5 rounded-lg cursor-not-allowed"
              title="Akan aktif setelah integrasi John Deere selesai"
            >
              {/* Logo John Deere placeholder */}
              <div className="w-5 h-5 bg-yellow-400 rounded-sm flex items-center justify-center text-green-800 text-xs font-black">
                JD
              </div>
              Masuk dengan John Deere
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              Integrasi John Deere dalam proses pengerjaan
            </p>
          </div>

          {/* Staff login link */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Anda staff Wisel?{" "}
            <a href="/admin/login" className="text-gray-600 hover:text-gray-800 font-semibold underline">
              Login sebagai Staff
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
