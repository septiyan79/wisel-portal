// =============================================================
// FILE: app/admin/login/page.tsx
// Halaman login untuk staff / admin Wisel
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Kalau sudah login sebagai staff, redirect ke landing page
  useEffect(() => {
    const raw = localStorage.getItem("wisel_user");
    if (!raw) return;
    const user = JSON.parse(raw);
    if (user?.role === "staff") router.replace("/");
  }, [router]);

  // ── DUMMY LOGIN ─────────────────────────────────────────────
  // Ganti dengan auth internal Wisel nanti
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200));

    if (email === "staff@wisel.co.id" && password === "admin123") {
      localStorage.setItem(
        "wisel_user",
        JSON.stringify({
          name: "Admin Wisel",
          email: email,
          role: "staff",
        })
      );
      router.push("/");
    } else {
      setError("Email atau password salah. Coba: staff@wisel.co.id / admin123");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">

      {/* Back */}
      <div className="p-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
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
              <ShieldCheck size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Staff Login</h1>
            <p className="text-sm text-gray-400 mt-1">
              Akses khusus untuk tim internal Wisel
            </p>
          </div>

          {/* Badge peringatan */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium px-4 py-2.5 rounded-lg text-center mb-4">
            Area terbatas — hanya untuk staff Wisel
          </div>

          {/* Form */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Email Staff
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@wisel.co.id"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="w-full px-4 py-2.5 pr-10 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:text-green-500 text-white font-bold py-2.5 rounded-lg transition-colors text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk sebagai Staff"
                )}
              </button>
            </form>
          </div>

          {/* Customer login link */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Bukan staff Wisel?{" "}
            <a href="/login" className="text-gray-400 hover:text-gray-200 font-semibold underline">
              Login sebagai Customer
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
