-- Allow a single Customer (tenant) to have more than one login account.
-- 1) Add "username" as the new unique login identifier, backfilled from the
--    existing (previously-unique) "customerAccount" value so every current
--    account keeps logging in with the same string it always used.
ALTER TABLE "User" ADD COLUMN "username" TEXT;
UPDATE "User" SET "username" = "customerAccount" WHERE "username" IS NULL;
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- 2) "customerAccount" is now a plain (non-unique) FK to Customer, since
--    multiple User rows can belong to the same tenant.
DROP INDEX "User_customerAccount_key";
CREATE INDEX "User_customerAccount_idx" ON "User"("customerAccount");
