import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"

// Kolom yang diharapkan (case-insensitive, trimmed)
const COL_MAP: Record<string, string> = {
  "so number":         "soNumber",
  "quotation":         "quotation",
  "po number":         "poNumber",
  "part number":       "partNumber",
  "ax part number":    "axPartNumber",
  "nama part":         "partName",
  "qty":               "qty",
  "invoice date":      "invoiceDate",
  "harga satuan":      "unitPrice",
  "total harga":       "totalPrice",
  "no. unit / device": "deviceNumber",
  "device number":     "deviceNumber",
}

function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase()
}

function parseDate(val: unknown): string | null {
  if (!val) return null
  // Jika xlsx sudah parse jadi Date object
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  // Jika string ISO / YYYY-MM-DD
  if (typeof val === "string") {
    const d = new Date(val)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  }
  // Jika number (Excel serial date)
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
  }
  return null
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const customerAccountOverride = formData.get("customerAccount") as string | null

  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })

  if (rows.length === 0) {
    return NextResponse.json({ error: "File kosong atau format tidak valid" }, { status: 400 })
  }

  // Normalisasi header
  const normalized = rows.map((row) => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(row)) {
      const mapped = COL_MAP[normalizeHeader(k)]
      if (mapped) out[mapped] = v
    }
    return out
  })

  const resolvedAccount =
    session.user.role !== "customer" && customerAccountOverride
      ? customerAccountOverride
      : session.user.customerAccount

  let success = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < normalized.length; i++) {
    const row = normalized[i]
    const rowNum = i + 2 // baris 1 = header

    try {
      const deviceNumber = row.deviceNumber ? String(row.deviceNumber).trim() : null

      // Pastikan unit ada jika deviceNumber diisi
      if (deviceNumber) {
        const unit = await prisma.unit.findUnique({ where: { deviceNumber } })
        if (!unit) {
          errors.push({ row: rowNum, message: `Device Number "${deviceNumber}" tidak ditemukan di master unit` })
          continue
        }
      }

      await prisma.transaction.create({
        data: {
          source:          "import",
          customerAccount: resolvedAccount,
          soNumber:        row.soNumber     ? String(row.soNumber).trim()     : null,
          quotation:       row.quotation    ? String(row.quotation).trim()    : null,
          poNumber:        row.poNumber     ? String(row.poNumber).trim()     : null,
          partNumber:      row.partNumber   ? String(row.partNumber).trim()   : null,
          axPartNumber:    row.axPartNumber ? String(row.axPartNumber).trim() : null,
          partName:        row.partName     ? String(row.partName).trim()     : null,
          qty:             row.qty          ? Number(row.qty)                 : null,
          invoiceDate:     parseDate(row.invoiceDate) ? new Date(parseDate(row.invoiceDate)!) : null,
          unitPrice:       row.unitPrice    ? Number(row.unitPrice)           : null,
          totalPrice:      row.totalPrice   ? Number(row.totalPrice)          : null,
          deviceNumber,
        },
      })
      success++
    } catch {
      errors.push({ row: rowNum, message: "Gagal menyimpan baris ini" })
    }
  }

  return NextResponse.json({ success, errors, total: rows.length })
}
