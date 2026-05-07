import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCustomerFromApiKey } from "@/lib/api-auth"

export async function GET(req: Request) {
  const customerAccount = await getCustomerFromApiKey(req)
  if (!customerAccount) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [transactions, stockAssignments] = await Promise.all([
    prisma.transaction.findMany({
      where: { customerAccount, isDeleted: false, NOT: { category: "S" } },
      select: {
        id: true,
        soNumber: true,
        quotation: true,
        poNumber: true,
        partNumber: true,
        axPartNumber: true,
        partName: true,
        qty: true,
        category: true,
        invoiceDate: true,
        packingSlipDate: true,
        unitPrice: true,
        totalPrice: true,
        deviceNumber: true,
        check: true,
        unit: { select: { serialNumber: true } },
      },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.stockAssignment.findMany({
      where: {
        stockTransaction: { customerAccount, isDeleted: false },
      },
      select: {
        id: true,
        qty: true,
        category: true,
        check: true,
        packingSlipDate: true,
        targetUnit: { select: { deviceNumber: true, serialNumber: true } },
        stockTransaction: {
          select: {
            soNumber: true,
            quotation: true,
            poNumber: true,
            partNumber: true,
            axPartNumber: true,
            partName: true,
            unitPrice: true,
            invoiceDate: true,
          },
        },
      },
    }),
  ])

  const txItems = transactions.map((t) => ({
    type: "transaction",
    id: t.id,
    deviceNumber: t.deviceNumber,
    serialNumber: t.unit?.serialNumber ?? null,
    quotation: t.quotation,
    soNumber: t.soNumber,
    poNumber: t.poNumber,
    partNumber: t.partNumber,
    axPartNumber: t.axPartNumber,
    partName: t.partName,
    qty: t.qty,
    invoiceDate: t.invoiceDate,
    unitPrice: t.unitPrice,
    totalPrice: t.totalPrice,
    category: t.category,
    notes: t.check,
    packingSlipDate: t.packingSlipDate,
  }))

  const stockItems = stockAssignments.map((a) => ({
    type: "stock_assignment",
    id: a.id,
    deviceNumber: a.targetUnit.deviceNumber,
    serialNumber: a.targetUnit.serialNumber,
    quotation: a.stockTransaction.quotation,
    soNumber: a.stockTransaction.soNumber,
    poNumber: a.stockTransaction.poNumber,
    partNumber: a.stockTransaction.partNumber,
    axPartNumber: a.stockTransaction.axPartNumber,
    partName: a.stockTransaction.partName,
    qty: a.qty,
    invoiceDate: a.stockTransaction.invoiceDate,
    unitPrice: a.stockTransaction.unitPrice,
    totalPrice:
      a.stockTransaction.unitPrice != null
        ? a.stockTransaction.unitPrice * a.qty
        : null,
    category: a.category,
    notes: a.check,
    packingSlipDate: a.packingSlipDate,
  }))

  const items = [...txItems, ...stockItems].sort((a, b) => {
    const dateA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0
    const dateB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0
    return dateB - dateA
  })

  return NextResponse.json(items)
}
