import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { UnitsTab } from "@/components/dashboard/UnitsTab"

export default async function UnitsPage() {
  const session = await auth()
  if (session!.user.role === "customer") redirect("/transactions")

  const [raw, customers] = await Promise.all([
    prisma.unit.findMany({
      orderBy: { deviceNumber: "asc" },
      select: {
        id: true,
        deviceNumber: true,
        serialNumber: true,
        fleetNumber: true,
        model: true,
        createdAt: true,
        customer: { select: { customerName: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { customerName: "asc" },
      select: { customerAccount: true, customerName: true },
    }),
  ])

  const units = raw.map((u) => ({
    id: u.id,
    deviceNumber: u.deviceNumber,
    serialNumber: u.serialNumber,
    fleetNumber: u.fleetNumber,
    model: u.model,
    createdAt: u.createdAt.toISOString(),
    customerName: u.customer?.customerName ?? null,
  }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Master Unit</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>
      <UnitsTab units={units} customers={customers} />
    </>
  )
}
