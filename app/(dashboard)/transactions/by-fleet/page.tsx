import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import FleetTransactionTable from "./FleetTransactionTable"
import { TransactionKpiCards } from "@/components/dashboard/TransactionKpiCards"

export default async function TransactionByFleetPage() {
  const session = await auth()

  const txWhere =
    session!.user.role !== "admin"
      ? { isDeleted: false, customerAccount: session!.user.customerAccount, NOT: { deviceNumber: "STOCK" } }
      : { isDeleted: false, NOT: { deviceNumber: "STOCK" } }

  const assignWhere =
    session!.user.role !== "admin"
      ? { stockTransaction: { isDeleted: false, customerAccount: session!.user.customerAccount } }
      : { stockTransaction: { isDeleted: false } }

  const [raw, rawAssignments, units] = await Promise.all([
    prisma.transaction.findMany({
      where: txWhere,
      select: { deviceNumber: true, category: true, totalPrice: true },
    }),
    prisma.stockAssignment.findMany({
      where: assignWhere,
      select: {
        targetDeviceNumber: true,
        qty: true,
        stockTransaction: { select: { unitPrice: true } },
      },
    }),
    prisma.unit.findMany({
      where: { NOT: { deviceNumber: "STOCK" } },
      select: { deviceNumber: true, fleetNumber: true, serialNumber: true },
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

  }

  for (const a of rawAssignments) {
    const key = a.targetDeviceNumber
    const price = a.stockTransaction.unitPrice != null ? a.qty * a.stockTransaction.unitPrice : 0
    const cur = groups.get(key) ?? { pmCount: 0, pmPrice: 0, repairCount: 0, repairPrice: 0, totalCount: 0, totalPrice: 0 }
    groups.set(key, {
      ...cur,
      repairCount: cur.repairCount + 1,
      repairPrice: cur.repairPrice + price,
      totalCount:  cur.totalCount  + 1,
      totalPrice:  cur.totalPrice  + price,
    })
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

      <TransactionKpiCards
        role={session!.user.role}
        customerAccount={session!.user.customerAccount}
        extraCard={
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-2xl font-black text-gray-900">{fleets.length.toLocaleString("id-ID")}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Fleet</p>
          </div>
        }
      />

      <FleetTransactionTable fleets={fleets} />
    </>
  )
}
