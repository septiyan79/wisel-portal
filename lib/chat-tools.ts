import { prisma } from '@/lib/db'

interface TransactionQueryParams {
  customerAccount: string | null
  dateFrom?: string
  dateTo?: string
  partNumber?: string
  partName?: string
  deviceNumber?: string
  limit?: number
}

export async function queryTransactions({
  customerAccount,
  dateFrom,
  dateTo,
  partNumber,
  partName,
  deviceNumber,
  limit = 20,
}: TransactionQueryParams) {
  const where: Record<string, unknown> = { isDeleted: false }
  if (customerAccount) where.customerAccount = customerAccount
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    where.packingSlipDate = dateFilter
  }
  if (partNumber) where.partNumber = { contains: partNumber, mode: 'insensitive' }
  if (partName) where.partName = { contains: partName, mode: 'insensitive' }
  if (deviceNumber) where.deviceNumber = { contains: deviceNumber, mode: 'insensitive' }

  const transactions = await prisma.transaction.findMany({
    where,
    take: Math.min(limit, 50),
    orderBy: { packingSlipDate: 'desc' },
    select: {
      soNumber: true,
      poNumber: true,
      partNumber: true,
      partName: true,
      qty: true,
      unitPrice: true,
      totalPrice: true,
      packingSlipDate: true,
      deviceNumber: true,
      customerAccount: true,
      source: true,
    },
  })

  return {
    count: transactions.length,
    data: transactions.map(t => ({
      ...t,
      packingSlipDate: t.packingSlipDate?.toISOString().split('T')[0] ?? null,
    })),
  }
}

interface SummaryParams {
  customerAccount: string | null
  dateFrom?: string
  dateTo?: string
  groupBy?: 'part' | 'unit' | 'month'
}

export async function getSummaryStats({
  customerAccount,
  dateFrom,
  dateTo,
  groupBy = 'part',
}: SummaryParams) {
  const where: Record<string, unknown> = { isDeleted: false }
  if (customerAccount) where.customerAccount = customerAccount
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)
    where.packingSlipDate = dateFilter
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      partNumber: true,
      partName: true,
      deviceNumber: true,
      qty: true,
      totalPrice: true,
      packingSlipDate: true,
      customerAccount: true,
    },
  })

  const totalSpending = transactions.reduce((sum, t) => sum + (t.totalPrice ?? 0), 0)
  const totalQty = transactions.reduce((sum, t) => sum + (t.qty ?? 0), 0)

  type GroupEntry = { label: string; count: number; totalPrice: number; totalQty: number }
  const groupedMap = new Map<string, GroupEntry>()

  for (const t of transactions) {
    let key = ''
    let label = ''

    if (groupBy === 'part') {
      key = t.partNumber ?? 'unknown'
      label = `${t.partNumber ?? '-'} - ${t.partName ?? ''}`
    } else if (groupBy === 'unit') {
      key = t.deviceNumber ?? 'unknown'
      label = t.deviceNumber ?? 'unknown'
    } else {
      const date = t.packingSlipDate ? new Date(t.packingSlipDate) : null
      key = date
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : 'unknown'
      label = key
    }

    const existing = groupedMap.get(key) ?? { label, count: 0, totalPrice: 0, totalQty: 0 }
    groupedMap.set(key, {
      label,
      count: existing.count + 1,
      totalPrice: existing.totalPrice + (t.totalPrice ?? 0),
      totalQty: existing.totalQty + (t.qty ?? 0),
    })
  }

  const topItems = Array.from(groupedMap.entries())
    .sort((a, b) => b[1].totalPrice - a[1].totalPrice)
    .slice(0, 10)
    .map(([key, val]) => ({ key, ...val, totalPrice: Math.round(val.totalPrice) }))

  return {
    totalTransactions: transactions.length,
    totalSpending: Math.round(totalSpending),
    totalQty,
    topItems,
  }
}

interface StockInfoParams {
  customerAccount: string | null
  deviceNumber?: string
  partNumber?: string
}

export async function getStockInfo({ customerAccount, deviceNumber, partNumber }: StockInfoParams) {
  const where: Record<string, unknown> = {}
  if (deviceNumber) where.targetDeviceNumber = { contains: deviceNumber, mode: 'insensitive' }
  if (partNumber) {
    where.stockTransaction = {
      partNumber: { contains: partNumber, mode: 'insensitive' },
      isDeleted: false,
    }
  }

  const assignments = await prisma.stockAssignment.findMany({
    where,
    take: 30,
    orderBy: { createdAt: 'desc' },
    include: {
      stockTransaction: {
        select: { partNumber: true, partName: true, customerAccount: true, unitPrice: true },
      },
    },
  })

  const filtered = customerAccount
    ? assignments.filter(a => a.stockTransaction.customerAccount === customerAccount)
    : assignments

  return {
    count: filtered.length,
    data: filtered.map(a => ({
      targetDeviceNumber: a.targetDeviceNumber,
      qty: a.qty,
      partNumber: a.stockTransaction.partNumber,
      partName: a.stockTransaction.partName,
      packingSlipDate: a.packingSlipDate?.toISOString().split('T')[0] ?? null,
    })),
  }
}

interface SearchPartsParams {
  customerAccount: string | null
  query: string
}

export async function searchParts({ customerAccount, query }: SearchPartsParams) {
  const where: Record<string, unknown> = {
    isDeleted: false,
    OR: [
      { partNumber: { contains: query, mode: 'insensitive' } },
      { partName: { contains: query, mode: 'insensitive' } },
      { axPartNumber: { contains: query, mode: 'insensitive' } },
    ],
  }
  if (customerAccount) where.customerAccount = customerAccount

  const results = await prisma.transaction.findMany({
    where,
    take: 20,
    distinct: ['partNumber'],
    orderBy: { updatedAt: 'desc' },
    select: {
      partNumber: true,
      axPartNumber: true,
      partName: true,
      unitPrice: true,
      category: true,
    },
  })

  return { count: results.length, data: results }
}
