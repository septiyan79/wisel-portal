import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <DashboardNavbar
        customerAccount={session.user.customerAccount}
        customerName={session.user.customerName}
        role={session.user.role}
      />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  )
}
