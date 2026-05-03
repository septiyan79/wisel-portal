import { google } from "googleapis"
import { prisma } from "@/lib/db"

const SHEET_NAME = "export"
const HEADERS = [
  "Customer Account", "Customer Name", "SO Number", "Device Number", "Serial Number",
  "Quotation", "PO Number", "Part Number", "AX Part Number", "Part Name",
  "QTY", "Invoice Date", "Unit Price", "Total Price", "Category", "CHECK", "Packing Slip Date",
]

type CellValue = string | number

function fmtDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const y = date.getFullYear()
  return `${m}/${d}/${y}`
}

function buildRows(
  tx: {
    customerAccount: string | null
    customer: { customerName: string } | null
    soNumber: string | null
    deviceNumber: string | null
    unit: { serialNumber: string | null } | null
    quotation: string | null
    poNumber: string | null
    partNumber: string | null
    axPartNumber: string | null
    partName: string | null
    qty: number | null
    invoiceDate: Date | null
    unitPrice: number | null
    totalPrice: number | null
    category: string | null
    check: string | null
    packingSlipDate: Date | null
    stockAssignments: {
      targetDeviceNumber: string
      qty: number
      check: string | null
      packingSlipDate: Date | null
      targetUnit: { serialNumber: string | null }
    }[]
  }
): CellValue[][] {
  const rows: CellValue[][] = []
  const base: CellValue[] = [
    tx.customerAccount ?? "",
    tx.customer?.customerName ?? "",
    tx.soNumber ?? "",
  ]
  const mid: CellValue[] = [
    tx.quotation ?? "",
    tx.poNumber ?? "",
    tx.partNumber ?? "",
    tx.axPartNumber ?? "",
    tx.partName ?? "",
  ]
  const invoiceDateStr = tx.invoiceDate ? fmtDate(tx.invoiceDate) : ""

  if (tx.category !== "S") {
    rows.push([
      ...base,
      tx.deviceNumber ?? "",
      tx.unit?.serialNumber ?? "",
      ...mid,
      tx.qty ?? "",
      invoiceDateStr,
      tx.unitPrice ?? "",
      tx.totalPrice ?? "",
      tx.category ?? "",
      tx.check ?? "",
      tx.packingSlipDate ? fmtDate(tx.packingSlipDate) : "",
    ])
    return rows
  }

  // Stock — expand assignments (category = "R")
  for (const a of tx.stockAssignments) {
    const assignedTotal = a.qty * (tx.unitPrice ?? 0)
    rows.push([
      ...base,
      a.targetDeviceNumber,
      a.targetUnit.serialNumber ?? "",
      ...mid,
      a.qty,
      invoiceDateStr,
      tx.unitPrice ?? "",
      assignedTotal,
      "R",
      a.check ?? "",
      a.packingSlipDate ? fmtDate(a.packingSlipDate) : "",
    ])
  }

  // Remaining stock (category tetap "S")
  const assignedQty = tx.stockAssignments.reduce((sum, a) => sum + a.qty, 0)
  const remaining = (tx.qty ?? 0) - assignedQty
  if (remaining > 0) {
    const remainingTotal = remaining * (tx.unitPrice ?? 0)
    rows.push([
      ...base,
      "",
      "",
      ...mid,
      remaining,
      invoiceDateStr,
      tx.unitPrice ?? "",
      remainingTotal,
      "S",
      tx.check ?? "",
      tx.packingSlipDate ? fmtDate(tx.packingSlipDate) : "",
    ])
  }

  return rows
}

export async function exportToSheets(): Promise<void> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (!email || !privateKey || !spreadsheetId) return

  const transactions = await prisma.transaction.findMany({
    where: { isDeleted: false },
    orderBy: { invoiceDate: "desc" },
    include: {
      customer: { select: { customerName: true } },
      unit: { select: { serialNumber: true } },
      stockAssignments: {
        include: { targetUnit: { select: { serialNumber: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  const directRows: CellValue[][] = []
  const assignmentRows: CellValue[][] = []
  const remainingRows: CellValue[][] = []

  for (const tx of transactions) {
    if (tx.category !== "S") {
      directRows.push(...buildRows(tx))
    } else {
      const expanded = buildRows(tx)
      const assignedCount = tx.stockAssignments.length
      assignmentRows.push(...expanded.slice(0, assignedCount))
      if (expanded.length > assignedCount) {
        remainingRows.push(expanded[expanded.length - 1])
      }
    }
  }

  const allRows = [...directRows, ...assignmentRows, ...remainingRows]

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET_NAME}!A:Q`,
  })

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [HEADERS, ...allRows] },
  })
}
