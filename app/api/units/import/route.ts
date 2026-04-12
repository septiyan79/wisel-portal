import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"

const COL_MAP: Record<string, string> = {
  "device number":  "deviceNumber",
  "serial number":  "serialNumber",
  "fleet number":   "fleetNumber",
  "model / tipe":   "model",
  "model":          "model",
}

function normalizeHeader(h: unknown): string {
  return String(h ?? "").trim().toLowerCase()
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role === "customer") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

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

  let success = 0
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < normalized.length; i++) {
    const row = normalized[i]
    const rowNum = i + 2

    const deviceNumber = row.deviceNumber ? String(row.deviceNumber).trim() : null

    if (!deviceNumber) {
      errors.push({ row: rowNum, message: "Device Number wajib diisi" })
      continue
    }

    try {
      await prisma.unit.upsert({
        where: { deviceNumber },
        update: {
          serialNumber: row.serialNumber ? String(row.serialNumber).trim() : null,
          fleetNumber:  row.fleetNumber  ? String(row.fleetNumber).trim()  : null,
          model:        row.model        ? String(row.model).trim()        : null,
        },
        create: {
          deviceNumber,
          serialNumber: row.serialNumber ? String(row.serialNumber).trim() : null,
          fleetNumber:  row.fleetNumber  ? String(row.fleetNumber).trim()  : null,
          model:        row.model        ? String(row.model).trim()        : null,
        },
      })
      success++
    } catch {
      errors.push({ row: rowNum, message: `Device Number "${deviceNumber}" sudah digunakan dengan Serial Number yang konflik` })
    }
  }

  return NextResponse.json({ success, errors, total: rows.length })
}
