import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import FleetDetailTable, { DetailRow } from "./FleetDetailTable"

export default async function FleetDetailPage({ params }: { params: Promise<{ fleet: string }> }) {
  const { fleet: encodedFleet } = await params
  const fleet = decodeURIComponent(encodedFleet)
  const session = await auth()

  const deviceNumberFilter = fleet === "—" ? null : fleet
  const isCustomer = session!.user.role === "customer"

  const txWhere = {
    isDeleted: false,
    deviceNumber: deviceNumberFilter,
    ...(isCustomer ? { customerAccount: session!.user.customerAccount } : {}),
  }

  const assignWhere = {
    targetDeviceNumber: fleet,
    ...(isCustomer
      ? { stockTransaction: { isDeleted: false, customerAccount: session!.user.customerAccount } }
      : { stockTransaction: { isDeleted: false } }),
  }

  const [raw, rawAssignments, unit] = await Promise.all([
    prisma.transaction.findMany({
      where: txWhere,
      orderBy: { invoiceDate: "desc" },
      select: {
        partNumber: true,
        axPartNumber: true,
        partName: true,
        category: true,
        qty: true,
        totalPrice: true,
        packingSlipDate: true,
        check: true,
      },
    }),
    prisma.stockAssignment.findMany({
      where: assignWhere,
      orderBy: { packingSlipDate: "desc" },
      select: {
        qty: true,
        packingSlipDate: true,
        check: true,
        stockTransaction: {
          select: {
            partNumber: true,
            axPartNumber: true,
            partName: true,
            unitPrice: true,
            qty: true,
          },
        },
      },
    }),
    prisma.unit.findUnique({
      where: { deviceNumber: fleet },
      select: { serialNumber: true, model: true, fleetNumber: true },
    }),
  ])

  if (raw.length === 0 && rawAssignments.length === 0) notFound()

  // Summary totals
  let globalPMCount = 0, globalPMPrice = 0
  let globalRepairCount = 0, globalRepairPrice = 0
  let globalTotalPrice = 0

  for (const t of raw) {
    const price = t.totalPrice ?? 0
    if (t.category === "P") { globalPMCount++;     globalPMPrice     += price }
    if (t.category === "R") { globalRepairCount++; globalRepairPrice += price }
    globalTotalPrice += price
  }
  for (const a of rawAssignments) {
    const price = a.qty * (a.stockTransaction.unitPrice ?? 0)
    globalRepairCount++
    globalRepairPrice += price
    globalTotalPrice  += price
  }

  // Build individual rows
  const rows: DetailRow[] = []

  for (const t of raw) {
    rows.push({
      rowType: "tx",
      partNumber: t.partNumber || t.axPartNumber || "—",
      partName:   t.partName ?? null,
      category:   t.category ?? "O",
      qty:        t.qty ?? 0,
      totalPrice: t.totalPrice ?? 0,
      packingSlipDate: t.packingSlipDate?.toISOString() ?? null,
      notes:      t.check ?? null,
    })
  }

  for (const a of rawAssignments) {
    const price = a.qty * (a.stockTransaction.unitPrice ?? 0)
    rows.push({
      rowType: "assign",
      partNumber: a.stockTransaction.partNumber || a.stockTransaction.axPartNumber || "—",
      partName:   a.stockTransaction.partName ?? null,
      category:   "R",
      qty:        a.qty,
      totalPrice: price,
      packingSlipDate: a.packingSlipDate?.toISOString() ?? null,
      notes:      a.check ?? null,
    })
  }

  return (
    <>
      <div className="mb-4">
        <Link
          href="/transactions/by-fleet"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={15} />
          Transactions by Fleet
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900">{unit?.fleetNumber ?? fleet}</h1>
        <div className="mt-1 h-0.5 w-10 bg-[#FFDE00]" />
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
          <span>
            Device: <span className="font-mono font-semibold text-gray-700">{fleet}</span>
          </span>
          {unit?.serialNumber && (
            <span>
              Serial: <span className="font-mono font-semibold text-gray-700">{unit.serialNumber}</span>
            </span>
          )}
          {unit?.model && (
            <span>
              Model: <span className="font-semibold text-gray-700">{unit.model}</span>
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
        totalCount={raw.length + rawAssignments.length}
        totalPrice={globalTotalPrice}
      />
    </>
  )
}
