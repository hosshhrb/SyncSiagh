-- CreateEnum
CREATE TYPE "SystemType" AS ENUM ('CRM', 'FINANCE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('CUSTOMER', 'PREINVOICE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'CONFLICT');

-- CreateTable
CREATE TABLE "EntityMapping" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "crmId" TEXT,
    "financeId" TEXT,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncSource" "SystemType" NOT NULL,
    "lastSyncTransactionId" TEXT NOT NULL,
    "crmChecksum" TEXT,
    "financeChecksum" TEXT,
    "crmUpdatedAt" TIMESTAMP(3),
    "financeUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntityMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "entityMappingId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerPayload" JSONB,
    "sourceSystem" "SystemType" NOT NULL,
    "targetSystem" "SystemType" NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT,
    "sourceData" JSONB NOT NULL,
    "targetDataBefore" JSONB,
    "targetDataAfter" JSONB,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastEventAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRetryQueue" (
    "id" TEXT NOT NULL,
    "syncLogId" TEXT NOT NULL,
    "nextRetryAt" TIMESTAMP(3) NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncRetryQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityMapping_entityType_lastSyncAt_idx" ON "EntityMapping"("entityType", "lastSyncAt");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMapping_entityType_crmId_key" ON "EntityMapping"("entityType", "crmId");

-- CreateIndex
CREATE UNIQUE INDEX "EntityMapping_entityType_financeId_key" ON "EntityMapping"("entityType", "financeId");

-- CreateIndex
CREATE INDEX "SyncLog_transactionId_idx" ON "SyncLog"("transactionId");

-- CreateIndex
CREATE INDEX "SyncLog_status_startedAt_idx" ON "SyncLog"("status", "startedAt");

-- CreateIndex
CREATE INDEX "SyncLog_entityMappingId_startedAt_idx" ON "SyncLog"("entityMappingId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SyncRetryQueue_syncLogId_key" ON "SyncRetryQueue"("syncLogId");

-- CreateIndex
CREATE INDEX "SyncRetryQueue_nextRetryAt_retryCount_idx" ON "SyncRetryQueue"("nextRetryAt", "retryCount");

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_entityMappingId_fkey" FOREIGN KEY ("entityMappingId") REFERENCES "EntityMapping"("id") ON DELETE CASCADE ON UPDATE CASCADE;
