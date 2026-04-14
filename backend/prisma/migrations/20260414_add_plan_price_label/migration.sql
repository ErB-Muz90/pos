-- Add priceLabel to plans
ALTER TABLE "plans"
ADD COLUMN IF NOT EXISTS "priceLabel" TEXT NOT NULL DEFAULT 'Custom';

-- Backfill common built-in plan labels
UPDATE "plans"
SET "priceLabel" = CASE
  WHEN "name" = 'starter' THEN 'Ksh 2,500'
  WHEN "name" = 'professional' THEN 'Ksh 7,500'
  WHEN "name" = 'enterprise' THEN 'Custom'
  ELSE COALESCE(NULLIF("priceLabel", ''), 'Custom')
END
WHERE "name" IN ('starter', 'professional', 'enterprise')
   OR "priceLabel" IS NULL
   OR "priceLabel" = '';
