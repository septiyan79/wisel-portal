import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import PartDetailTable, { FleetRow } from "./PartDetailTable"

export default async function PartDetailPage({ params }: { params: Promise<{ part: string }> }) {
  const { part: encodedPart } = await params
  const partNumber = decodeURIComponent(encodedPart)
  const session = await auth()

  const where = {
    isDeleted: false,
    OR: [
      { partNumber: partNumber === "—" ? null : partNumber },
      { axPartNumber: partNumber === "—" ? null : partNumber },
    ],
    ...(session!.user.role === "customer"
      ? { customerAccount: session!.user.customerAccount }
      : {}),
  }

  const [raw, units] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      select: {
        category: true,
        qty: true,
        totalPrice: true,
        invoiceDate: true,
        deviceNumber: true,
      },
    }),
    prisma.unit.findMany({
      select: {
        deviceNumber: true,
        fleetNumber: true,
      },
    }),
  ])

  if (raw.length === 0) notFound()

  const unitMap = new Map(units.map((u) => [u.deviceNumber, u.fleetNumber ?? null]))

  type Agg = {
    pmCount: number
    repairCount: number
    pmQty: number
    repairQty: number
    qty: number
    totalPrice: number
    pmPrice: number
    repairPrice: number
    latestDate: Date | null
  }

  const fleetMap = new Map<string, Agg>()
  let globalPMCount = 0, globalPMPrice = 0
  let globalRepairCount = 0, globalRepairPrice = 0
  let globalTotalPrice = 0

  for (const t of raw) {
    const deviceKey = t.deviceNumber || "—"
    const fleetNumber = unitMap.get(t.deviceNumber ?? "") ?? null
    const key = fleetNumber ?? deviceKey

    const price = t.totalPrice ?? 0
    const qty = t.qty ?? 0
    const isPM = t.category === "P"
    const isRepair = t.category === "R"

    const cur = fleetMap.get(key) ?? {
      pmCount: 0, repairCount: 0,
      pmQty: 0, repairQty: 0,
      qty: 0, totalPrice: 0, pmPrice: 0, repairPrice: 0,
      latestDate: null,
    }
    fleetMap.set(key, {
      pmCount:     cur.pmCount     + (isPM     ? 1 : 0),
      repairCount: cur.repairCount + (isRepair ? 1 : 0),
      pmQty:       cur.pmQty       + (isPM     ? qty   : 0),
      repairQty:   cur.repairQty   + (isRepair ? qty   : 0),
      qty:         cur.qty         + qty,
      totalPrice:  cur.totalPrice  + price,
      pmPrice:     cur.pmPrice     + (isPM     ? price : 0),
      repairPrice: cur.repairPrice + (isRepair ? price : 0),
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

  const rows: FleetRow[] = [...fleetMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fleetLabel, agg]) => ({
      fleetLabel,
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
          href="/transactions/by-part"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={15} />
          Transactions by Part Number
        </Link>
      </div>

      {/* Part identity header */}
      <div className="mb-6">
        <h1 className="text-xl font-black font-mono text-gray-900">{partNumber}</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
      </div>

      <PartDetailTable
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
