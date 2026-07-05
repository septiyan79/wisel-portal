import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import PartDetailTable, { TxRow } from "./PartDetailTable"

export default async function PartDetailPage({ params }: { params: Promise<{ part: string }> }) {
  const { part: encodedPart } = await params
  const partNumber = decodeURIComponent(encodedPart)
  const session = await auth()
  const isCustomer = session!.user.role !== "admin"
  const customerFilter = isCustomer ? { customerAccount: session!.user.customerAccount } : {}

  const partFilter =
    partNumber === "—"
      ? [{ partNumber: null as null }, { axPartNumber: null as null }]
      : [{ partNumber }, { axPartNumber: partNumber }]

  const [rawTx, rawStock, units] = await Promise.all([
    // Regular transactions (P, R, O — not stock)
    prisma.transaction.findMany({
      where: {
        isDeleted: false,
        category: { not: "S" },
        OR: partFilter,
        ...customerFilter,
      },
      orderBy: { invoiceDate: "desc" },
      select: {
        id: true,
        category: true,
        qty: true,
        totalPrice: true,
        packingSlipDate: true,
        check: true,
        deviceNumber: true,
      },
    }),
    // Stock transactions with their individual assignments
    prisma.transaction.findMany({
      where: {
        isDeleted: false,
        category: "S",
        OR: partFilter,
        ...customerFilter,
      },
      select: {
        id: true,
        qty: true,
        unitPrice: true,
        invoiceDate: true,
        packingSlipDate: true,
        deviceNumber: true,
        stockAssignments: {
          select: {
            id: true,
            qty: true,
            packingSlipDate: true,
            check: true,
            targetDeviceNumber: true,
          },
        },
      },
    }),
    prisma.unit.findMany({
      select: { deviceNumber: true, fleetNumber: true },
    }),
  ])

  if (rawTx.length === 0 && rawStock.length === 0) notFound()

  const unitMap = new Map(units.map((u) => [u.deviceNumber, u.fleetNumber ?? null]))

  function resolveFleet(deviceNumber: string | null) {
    if (!deviceNumber) return "—"
    return unitMap.get(deviceNumber) ?? deviceNumber
  }

  let globalPMCount = 0, globalPMPrice = 0
  let globalRepairCount = 0, globalRepairPrice = 0
  let globalTotalPrice = 0

  const rows: TxRow[] = []

  // Regular transaction rows
  for (const t of rawTx) {
    const price = t.totalPrice ?? 0
    const isPM = t.category === "P"
    const isRepair = t.category === "R"

    if (isPM)     { globalPMCount++;     globalPMPrice     += price }
    if (isRepair) { globalRepairCount++; globalRepairPrice += price }
    globalTotalPrice += price

    rows.push({
      id: t.id,
      fleetLabel: resolveFleet(t.deviceNumber),
      category: isPM ? "P" : isRepair ? "R" : "O",
      qty: t.qty ?? 0,
      totalPrice: price,
      packingSlipDate: t.packingSlipDate?.toISOString() ?? null,
      notes: t.check ?? null,
    })
  }

  // Stock assignment rows → category R; remaining qty → category S
  for (const s of rawStock) {
    const totalAssigned = s.stockAssignments.reduce((sum, a) => sum + a.qty, 0)
    const remaining = (s.qty ?? 0) - totalAssigned
    const unitPrice = s.unitPrice ?? 0
    const invoiceDate = s.invoiceDate?.toISOString() ?? null

    for (const a of s.stockAssignments) {
      const price = a.qty * unitPrice
      globalRepairCount++
      globalRepairPrice += price
      globalTotalPrice  += price

      rows.push({
        id: a.id,
        fleetLabel: resolveFleet(a.targetDeviceNumber),
        category: "R",
        qty: a.qty,
        totalPrice: price,
        packingSlipDate: a.packingSlipDate?.toISOString() ?? null,
        notes: a.check ?? null,
      })
    }

    if (remaining > 0) {
      const price = remaining * unitPrice
      globalTotalPrice += price

      rows.push({
        id: `${s.id}-rem`,
        fleetLabel: resolveFleet(s.deviceNumber),
        category: "S",
        qty: remaining,
        totalPrice: price,
        packingSlipDate: s.packingSlipDate?.toISOString() ?? null,
        notes: null,
      })
    }
  }

  // Sort all rows newest first
  rows.sort((a, b) => {
    if (!a.packingSlipDate && !b.packingSlipDate) return 0
    if (!a.packingSlipDate) return 1
    if (!b.packingSlipDate) return -1
    return b.packingSlipDate.localeCompare(a.packingSlipDate)
  })

  const totalAssignmentRows = rawStock.reduce((n, s) => n + s.stockAssignments.length, 0)
  const totalRemainingRows = rawStock.filter((s) => {
    const assigned = s.stockAssignments.reduce((sum, a) => sum + a.qty, 0)
    return (s.qty ?? 0) - assigned > 0
  }).length

  return (
    <>
      <div className="mb-4">
        <Link
          href="/transactions/by-part"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={15} />
          Transactions by Part Number
        </Link>
      </div>

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
        totalCount={rawTx.length + totalAssignmentRows + totalRemainingRows}
        totalPrice={globalTotalPrice}
      />
    </>
  )
}
