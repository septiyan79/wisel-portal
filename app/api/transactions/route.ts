import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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

  const results = []
  for (const item of items) {
    const {
      soNumber, quotation, poNumber, partNumber, axPartNumber, partName,
      qty, category, invoiceDate, packingSlipDate, unitPrice, totalPrice, deviceNumber, customerAccount,
    } = item

    // Admin boleh pilih customer, customer hanya bisa atas nama diri sendiri
    const resolvedAccount =
      session.user.role !== "customer" && customerAccount
        ? customerAccount
        : session.user.customerAccount

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
      },
    })
    results.push(transaction)
  }

  return NextResponse.json(results.length === 1 ? results[0] : results, { status: 201 })
}
