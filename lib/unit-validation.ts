import { prisma } from "@/lib/db"

/**
 * Ensures a deviceNumber exists and belongs to the given customer.
 * Returns an error message if invalid, or null if the device is valid and owned by that customer.
 */
export async function validateUnitOwnership(
  deviceNumber: string,
  expectedCustomerAccount: string
): Promise<string | null> {
  const unit = await prisma.unit.findUnique({
    where: { deviceNumber },
    select: { customerAccount: true },
  })
  if (!unit) return `Device Number "${deviceNumber}" tidak ditemukan di master unit`
  if (unit.customerAccount !== expectedCustomerAccount) {
    return `Device Number "${deviceNumber}" terdaftar milik customer lain, tidak bisa dipakai untuk transaksi ini`
  }
  return null
}
