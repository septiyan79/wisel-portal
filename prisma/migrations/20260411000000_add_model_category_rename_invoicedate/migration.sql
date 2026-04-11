-- AlterTable Unit: add model column
ALTER TABLE "Unit" ADD COLUMN "model" TEXT;

-- AlterTable Transaction: rename datePackingSlip to invoiceDate
ALTER TABLE "Transaction" RENAME COLUMN "datePackingSlip" TO "invoiceDate";

-- AlterTable Transaction: add category column
ALTER TABLE "Transaction" ADD COLUMN "category" TEXT;
