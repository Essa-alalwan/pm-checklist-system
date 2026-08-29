-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('technician', 'supervisor');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('submitted', 'reviewed');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('done', 'na', 'flagged');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('created', 'reviewed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "shortLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistRecord" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "kksCode" TEXT NOT NULL,
    "equipmentDescription" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "preparedBy" TEXT NOT NULL,
    "doneBy" TEXT NOT NULL,
    "numberOfHelpers" INTEGER NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'submitted',
    "signatureDataUrl" TEXT NOT NULL,
    "remarks" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistRecordItem" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "templateItemId" TEXT NOT NULL,
    "status" "ItemStatus" NOT NULL,
    "note" TEXT,

    CONSTRAINT "ChecklistRecordItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistReading" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "groupLabel" TEXT,
    "value" DECIMAL(12,4),
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ChecklistReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistAuditEvent" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ChecklistAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistTemplate_type_key" ON "ChecklistTemplate"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistTemplateItem_templateId_itemKey_key" ON "ChecklistTemplateItem"("templateId", "itemKey");

-- CreateIndex
CREATE INDEX "ChecklistRecord_kksCode_idx" ON "ChecklistRecord"("kksCode");

-- CreateIndex
CREATE INDEX "ChecklistRecord_doneBy_idx" ON "ChecklistRecord"("doneBy");

-- CreateIndex
CREATE INDEX "ChecklistRecord_date_idx" ON "ChecklistRecord"("date");

-- CreateIndex
CREATE INDEX "ChecklistRecord_status_idx" ON "ChecklistRecord"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistRecordItem_recordId_templateItemId_key" ON "ChecklistRecordItem"("recordId", "templateItemId");

-- CreateIndex
CREATE INDEX "ChecklistReading_recordId_idx" ON "ChecklistReading"("recordId");

-- CreateIndex
CREATE INDEX "ChecklistReading_key_idx" ON "ChecklistReading"("key");

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistRecord" ADD CONSTRAINT "ChecklistRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistRecord" ADD CONSTRAINT "ChecklistRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistRecordItem" ADD CONSTRAINT "ChecklistRecordItem_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ChecklistRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistRecordItem" ADD CONSTRAINT "ChecklistRecordItem_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "ChecklistTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistReading" ADD CONSTRAINT "ChecklistReading_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ChecklistRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistAuditEvent" ADD CONSTRAINT "ChecklistAuditEvent_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ChecklistRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistAuditEvent" ADD CONSTRAINT "ChecklistAuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
