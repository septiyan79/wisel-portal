import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import FleetTransactionTable from "./FleetTransactionTable"

export default async function TransactionByFleetPage() {
  const session = await auth()

  const where =
    session!.user.role === "customer"
      ? { isDeleted: false, customerAccount: session!.user.customerAccount, NOT: { deviceNumber: "STOCK" } }
      : { isDeleted: false, NOT: { deviceNumber: "STOCK" } }

  const [raw, units] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: {
        deviceNumber: true,
        category: true,
        totalPrice: true,
      },
    }),
    prisma.unit.findMany({
      where: { NOT: { deviceNumber: "STOCK" } },
      select: {
        deviceNumber: true,
        fleetNumber: true,
        serialNumber: true,
      },
    }),
  ])

  const unitMap = new Map(units.map((u) => [u.deviceNumber, { fleetNumber: u.fleetNumber ?? null, serialNumber: u.serialNumber ?? null }]))

  type Agg = {
    pmCount: number
    pmPrice: number
    repairCount: number
    repairPrice: number
    totalCount: number
    totalPrice: number
  }

  const groups = new Map<string, Agg>()
  let globalPMCount = 0, globalPMPrice = 0
  let globalRepairCount = 0, globalRepairPrice = 0
  let globalTotalPrice = 0

  for (const t of raw) {
    const key = t.deviceNumber || "—"
    const price = t.totalPrice ?? 0
    const isPM = t.category === "P"
    const isRepair = t.category === "R"

    const cur = groups.get(key) ?? { pmCount: 0, pmPrice: 0, repairCount: 0, repairPrice: 0, totalCount: 0, totalPrice: 0 }
    groups.set(key, {
      pmCount:     cur.pmCount     + (isPM     ? 1     : 0),
      pmPrice:     cur.pmPrice     + (isPM     ? price : 0),
      repairCount: cur.repairCount + (isRepair ? 1     : 0),
      repairPrice: cur.repairPrice + (isRepair ? price : 0),
      totalCount:  cur.totalCount  + 1,
      totalPrice:  cur.totalPrice  + price,
    })

    if (isPM)     { globalPMCount++;     globalPMPrice     += price }
    if (isRepair) { globalRepairCount++; globalRepairPrice += price }
    globalTotalPrice += price
  }

  const fleets = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fleet, agg]) => ({
      fleet,
      fleetNumber: unitMap.get(fleet)?.fleetNumber ?? null,
      serialNumber: unitMap.get(fleet)?.serialNumber ?? null,
      ...agg,
    }))

  return (
    <>
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">Transactions by Fleet Number</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>

      <FleetTransactionTable
        fleets={fleets}
        totalFleet={fleets.length}
        pmCount={globalPMCount}
        pmPrice={globalPMPrice}
        repairCount={globalRepairCount}
        repairPrice={globalRepairPrice}
        totalCount={raw.length}
        totalPrice={globalTotalPrice}
      />
    </>
  )
}
