-- CreateEnum
CREATE TYPE "LogFieldType" AS ENUM ('text', 'number');

-- CreateTable
CREATE TABLE "ChecklistTemplateLogField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "groupLabel" TEXT NOT NULL,
    "columnLabel" TEXT NOT NULL,
    "fieldType" "LogFieldType" NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ChecklistTemplateLogField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistLogCell" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "groupLabel" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "templateLogFieldId" TEXT NOT NULL,
    "textValue" TEXT,
    "numericValue" DECIMAL(12,4),

    CONSTRAINT "ChecklistLogCell_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChecklistLogCell_recordId_idx" ON "ChecklistLogCell"("recordId");

-- AddForeignKey
ALTER TABLE "ChecklistTemplateLogField" ADD CONSTRAINT "ChecklistTemplateLogField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistLogCell" ADD CONSTRAINT "ChecklistLogCell_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ChecklistRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
