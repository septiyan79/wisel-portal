import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"
import { exportToSheets } from "@/lib/gsheets"

// Kolom yang diharapkan (case-insensitive, trimmed)
const COL_MAP: Record<string, string> = {
  "so number":         "soNumber",
  "quotation":         "quotation",
  "po number":         "poNumber",
  "part number":       "partNumber",
  "ax part number":    "axPartNumber",
  "nama part":         "partName",
  "category":          "category",
  "qty":               "qty",
  "invoice date":      "invoiceDate",
  "packing slip date": "packingSlipDate",
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
  // Number = Excel serial date — parse_date_code adalah aritmatika murni, bebas timezone
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
  }
  // String — coba ISO "YYYY-MM-DD" langsung, lalu fallback ke generic
  if (typeof val === "string" && val.trim()) {
    const iso = val.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
    // Fallback: ambil bagian tanggal saja tanpa timezone conversion
    const parts = iso.match(/(\d{1,4})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
    if (parts) {
      const [, a, b, c] = parts
      // Deteksi format: jika a > 31 → YYYY-MM-DD, jika c > 31 → DD/MM/YYYY atau MM/DD/YYYY
      if (Number(a) > 31) {
        return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`
      } else if (Number(c) > 31) {
        // DD/MM/YYYY atau MM/DD/YYYY — asumsikan MM/DD/YYYY (format Excel default)
        return `${c}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`
      }
    }
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
  const workbook = XLSX.read(buffer, { type: "buffer" })
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
      const rawCategory = row.category ? String(row.category).trim().toUpperCase() : null
      const rawDevice   = row.deviceNumber ? String(row.deviceNumber).trim() : null

      // Transaksi stock: deviceNumber otomatis STOCK
      const deviceNumber = rawCategory === "S" && !rawDevice ? "STOCK" : rawDevice

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
          category:        rawCategory,
          qty:             row.qty          ? Number(row.qty)                 : null,
          invoiceDate:     parseDate(row.invoiceDate)     ? new Date(parseDate(row.invoiceDate)!)     : null,
          packingSlipDate: parseDate(row.packingSlipDate) ? new Date(parseDate(row.packingSlipDate)!) : null,
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

  if (success > 0) void exportToSheets()
  return NextResponse.json({ success, errors, total: rows.length })
}
