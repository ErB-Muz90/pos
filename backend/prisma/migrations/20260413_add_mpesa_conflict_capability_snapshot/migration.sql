-- MpesaConflict table (Gap 2 — F4)
CREATE TABLE IF NOT EXISTS "mpesa_conflicts" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "mpesaRef" TEXT NOT NULL,
  "saleId1" TEXT NOT NULL,
  "saleId2" TEXT,
  "status" TEXT NOT NULL DEFAULT 'CONFLICT_PENDING',
  "resolvedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolution" TEXT,
  "autoResolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mpesa_conflicts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "mpesa_conflicts_organizationId_idx" ON "mpesa_conflicts"("organizationId");
CREATE INDEX IF NOT EXISTS "mpesa_conflicts_mpesaRef_idx" ON "mpesa_conflicts"("mpesaRef");

-- CapabilitySnapshot table (Gap 3 — A1)
CREATE TABLE IF NOT EXISTS "capability_snapshots" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "permissions" JSONB NOT NULL DEFAULT '[]',
  "validUntil" TIMESTAMP(3) NOT NULL,
  "revoked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "capability_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "capability_snapshots_userId_key" ON "capability_snapshots"("userId");
CREATE INDEX IF NOT EXISTS "capability_snapshots_userId_idx" ON "capability_snapshots"("userId");
