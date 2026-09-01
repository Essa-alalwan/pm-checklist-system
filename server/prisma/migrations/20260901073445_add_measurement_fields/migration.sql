-- CreateTable
CREATE TABLE "ChecklistTemplateMeasurementField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "groupLabel" TEXT,
    "rowLabel" TEXT,
    "columnLabel" TEXT NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "ChecklistTemplateMeasurementField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChecklistTemplateMeasurementField" ADD CONSTRAINT "ChecklistTemplateMeasurementField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
