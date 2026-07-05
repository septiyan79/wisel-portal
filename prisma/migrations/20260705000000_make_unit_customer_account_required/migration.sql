-- Every Unit must belong to a Customer: backfilled existing rows to a known
-- customer before this migration (see project history), then enforce NOT NULL.
ALTER TABLE "Unit" ALTER COLUMN "customerAccount" SET NOT NULL;
