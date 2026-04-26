import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import FleetDetailTable from "./FleetDetailTable"

export default async function FleetDetailPage({ params }: { params: Promise<{ fleet: string }> }) {
  const { fleet: encodedFleet } = await params
  const fleet = decodeURIComponent(encodedFleet)
  const session = await auth()

  const deviceNumberFilter = fleet === "—" ? null : fleet

  const where = {
    isDeleted: false,
    deviceNumber: deviceNumberFilter,
    ...(session!.user.role === "customer"
      ? { customerAccount: session!.user.customerAccount }
      : {}),
  }

  const [raw, unit] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      select: {
        partNumber: true,
        axPartNumber: true,
        partName: true,
        category: true,
        qty: true,
        totalPrice: true,
        invoiceDate: true,
      },
    }),
    prisma.unit.findUnique({
      where: { deviceNumber: fleet },
      select: { serialNumber: true, model: true, fleetNumber: true },
    }),
  ])

  if (raw.length === 0) notFound()

  type Agg = {
    partName: string | null
    pmCount: number
    repairCount: number
    otherCount: number
    qty: number
    totalPrice: number
    latestDate: Date | null
  }

  const partMap = new Map<string, Agg>()
  let globalPMCount = 0, globalPMPrice = 0
  let globalRepairCount = 0, globalRepairPrice = 0
  let globalTotalPrice = 0

  for (const t of raw) {
    const key = t.partNumber || t.axPartNumber || "—"
    const price = t.totalPrice ?? 0
    const isPM = t.category === "P"
    const isRepair = t.category === "R"

    const cur = partMap.get(key) ?? {
      partName: t.partName ?? null,
      pmCount: 0, repairCount: 0, otherCount: 0,
      qty: 0, totalPrice: 0, latestDate: null,
    }
    partMap.set(key, {
      partName: cur.partName ?? t.partName ?? null,
      pmCount:     cur.pmCount     + (isPM     ? 1 : 0),
      repairCount: cur.repairCount + (isRepair  ? 1 : 0),
      otherCount:  cur.otherCount  + (!isPM && !isRepair ? 1 : 0),
      qty:         cur.qty         + (t.qty ?? 0),
      totalPrice:  cur.totalPrice  + price,
      latestDate:
        t.invoiceDate
          ? cur.latestDate == null || t.invoiceDate > cur.latestDate
            ? t.invoiceDate
            : cur.latestDate
          : cur.latestDate,
    })

    if (isPM)     { globalPMCount++;     globalPMPrice     += price }
    if (isRepair) { globalRepairCount++; globalRepairPrice += price }
    globalTotalPrice += price
  }

  const rows = [...partMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([partNumber, agg]) => ({
      partNumber,
      partName: agg.partName,
      category:
        agg.pmCount > 0 && agg.repairCount > 0 ? "M"
        : agg.pmCount > 0 ? "P"
        : agg.repairCount > 0 ? "R"
        : "O",
      qty: agg.qty,
      totalPrice: agg.totalPrice,
      latestDate: agg.latestDate?.toISOString() ?? null,
    }))

  return (
    <>
      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/transactions/by-fleet"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={15} />
          Transactions by Fleet
        </Link>
      </div>

      {/* Fleet identity header */}
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900">{unit?.fleetNumber ?? fleet}</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
          <span>
            Device:{" "}
            <span className="font-mono font-semibold text-gray-700">{fleet}</span>
          </span>
          {unit?.serialNumber && (
            <span>
              Serial:{" "}
              <span className="font-mono font-semibold text-gray-700">{unit.serialNumber}</span>
            </span>
          )}
          {unit?.model && (
            <span>
              Model:{" "}
              <span className="font-semibold text-gray-700">{unit.model}</span>
            </span>
          )}
        </div>
      </div>

      <FleetDetailTable
        rows={rows}
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
