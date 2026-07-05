import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { UsersTab } from "@/components/dashboard/UsersTab"

export default async function UsersPage() {
  const session = await auth()
  if (session!.user.role !== "admin") redirect("/dashboard")

  const raw = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      customerAccount: true,
      role: true,
      createdAt: true,
      customer: { select: { customerName: true } },
    },
  })

  const users = raw.map((u) => ({
    id: u.id,
    username: u.username,
    customerAccount: u.customerAccount,
    customerName: u.customer?.customerName ?? "",
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">User Management</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <UsersTab initialUsers={users} />
    </>
  )
}
