import { NextResponse } from "next/server"
import { exportToSheets } from "@/lib/gsheets"

export async function GET() {
  try {
    await exportToSheets()
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
