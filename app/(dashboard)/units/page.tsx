import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { UnitsTab } from "@/components/dashboard/UnitsTab"

export default async function UnitsPage() {
  const session = await auth()
  if (session!.user.role === "customer") redirect("/transactions")

  const raw = await prisma.unit.findMany({
    orderBy: { deviceNumber: "asc" },
    select: {
      id: true,
      deviceNumber: true,
      serialNumber: true,
      fleetNumber: true,
      model: true,
      createdAt: true,
    },
  })

  const units = raw.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Master Unit</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <UnitsTab units={units} />
    </>
  )
}
