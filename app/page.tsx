import { redirect } from "next/navigation"

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function Home() {
  redirect("/login")
}