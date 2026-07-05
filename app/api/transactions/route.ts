import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { exportToSheets } from "@/lib/gsheets"
import { validateUnitOwnership } from "@/lib/unit-validation"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const where =
    session.user.role === "customer"
      ? { isDeleted: false, customerAccount: session.user.customerAccount, NOT: { category: "S" } }
      : { isDeleted: false, NOT: { category: "S" } }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { invoiceDate: "desc" },
    select: {
      id: true,
      soNumber: true,
      partNumber: true,
      axPartNumber: true,
      partName: true,
      qty: true,
      category: true,
      invoiceDate: true,
      packingSlipDate: true,
      unitPrice: true,
      totalPrice: true,
      customerAccount: true,
      deviceNumber: true,
      source: true,
    },
  })

  return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  // Support single object or array of objects
  const items: typeof body[] = Array.isArray(body) ? body : [body]

  // Resolve customerAccount per item, then validate device ownership before writing anything
  const resolved = items.map((item) => ({
    item,
    resolvedAccount:
      session.user.role !== "customer" && item.customerAccount
        ? item.customerAccount
        : session.user.customerAccount,
  }))

  for (const { item, resolvedAccount } of resolved) {
    if (item.deviceNumber) {
      const error = await validateUnitOwnership(String(item.deviceNumber).trim(), resolvedAccount)
      if (error) return NextResponse.json({ error }, { status: 400 })
    }
  }

  const results = []
  for (const { item, resolvedAccount } of resolved) {
    const {
      soNumber, quotation, poNumber, partNumber, axPartNumber, partName,
      qty, category, invoiceDate, packingSlipDate, unitPrice, totalPrice, deviceNumber, check,
    } = item

    const transaction = await prisma.transaction.create({
      data: {
        source: "manual",
        customerAccount: resolvedAccount,
        soNumber:     soNumber     || null,
        quotation:    quotation    || null,
        poNumber:     poNumber     || null,
        partNumber:   partNumber   || null,
        axPartNumber: axPartNumber || null,
        partName:     partName     || null,
        qty:             qty != null ? Number(qty) : null,
        category:        category        || null,
        invoiceDate:     invoiceDate     ? new Date(invoiceDate)     : null,
        packingSlipDate: packingSlipDate ? new Date(packingSlipDate) : null,
        unitPrice:    unitPrice  != null ? Number(unitPrice)  : null,
        totalPrice:   totalPrice != null ? Number(totalPrice) : null,
        deviceNumber: deviceNumber || null,
        check:        check        || null,
      },
    })
    results.push(transaction)
  }

  void exportToSheets()
  return NextResponse.json(results.length === 1 ? results[0] : results, { status: 201 })
}
