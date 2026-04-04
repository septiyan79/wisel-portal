import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const BATCH_SIZE = 1000

interface TransactionPayload {
  externalId: string
  soNumber?: string
  quotation?: string
  poNumber?: string
  partNumber?: string
  axPartNumber?: string
  partName?: string
  qty?: number
  datePackingSlip?: string
  unitPrice?: number
  totalPrice?: number
  customerAccount?: string
  deviceNumber?: string
}

export async function POST(req: NextRequest) {
  let body: TransactionPayload[]

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an array" }, { status: 400 })
  }

  const startedAt = Date.now()

  try {
    // Collect all externalIds from the incoming payload
    const incomingExternalIds = body
      .map((t) => t.externalId)
      .filter((id): id is string => !!id)

    // Upsert in batches
    let upsertedCount = 0
    for (let i = 0; i < body.length; i += BATCH_SIZE) {
      const batch = body.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map((t) =>
          prisma.transaction.upsert({
            where: { externalId: t.externalId },
            update: {
              source: "provider",
              isDeleted: false,
              deletedAt: null,
              soNumber: t.soNumber ?? null,
              quotation: t.quotation ?? null,
              poNumber: t.poNumber ?? null,
              partNumber: t.partNumber ?? null,
              axPartNumber: t.axPartNumber ?? null,
              partName: t.partName ?? null,
              qty: t.qty ?? null,
              datePackingSlip: t.datePackingSlip ? new Date(t.datePackingSlip) : null,
              unitPrice: t.unitPrice ?? null,
              totalPrice: t.totalPrice ?? null,
              customerAccount: t.customerAccount ?? null,
              deviceNumber: t.deviceNumber ?? null,
            },
            create: {
              externalId: t.externalId,
              source: "provider",
              soNumber: t.soNumber ?? null,
              quotation: t.quotation ?? null,
              poNumber: t.poNumber ?? null,
              partNumber: t.partNumber ?? null,
              axPartNumber: t.axPartNumber ?? null,
              partName: t.partName ?? null,
              qty: t.qty ?? null,
              datePackingSlip: t.datePackingSlip ? new Date(t.datePackingSlip) : null,
              unitPrice: t.unitPrice ?? null,
              totalPrice: t.totalPrice ?? null,
              customerAccount: t.customerAccount ?? null,
              deviceNumber: t.deviceNumber ?? null,
            },
          })
        )
      )

      upsertedCount += batch.length
    }

    // Soft delete: provider rows not in incoming payload
    const softDeleted = await prisma.transaction.updateMany({
      where: {
        source: "provider",
        isDeleted: false,
        externalId: { notIn: incomingExternalIds },
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    await prisma.syncLog.create({
      data: {
        totalRows: upsertedCount,
        status: "success",
        note: `Upserted: ${upsertedCount}, Soft-deleted: ${softDeleted.count}`,
      },
    })

    return NextResponse.json({
      success: true,
      upserted: upsertedCount,
      softDeleted: softDeleted.count,
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"

    await prisma.syncLog.create({
      data: {
        totalRows: body.length,
        status: "error",
        note: message,
      },
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
