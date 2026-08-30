import { Prisma } from '@prisma/client'
import type { ChecklistRecord, ChecklistType } from '../types/checklist'
import {
  buildGeneratorReadings,
  buildLvAcMotorReadings,
  parseGeneratorReadings,
  parseLvAcMotorReadings,
  type GeneratorMeasurements,
  type LvAcMotorMeasurements,
} from './readings'

export const recordInclude = Prisma.validator<Prisma.ChecklistRecordInclude>()({
  template: { include: { items: true } },
  items: { include: { templateItem: true } },
  readings: true,
})

export type DbRecordWithRelations = Prisma.ChecklistRecordGetPayload<{ include: typeof recordInclude }>

export function toApiRecord(db: DbRecordWithRelations): ChecklistRecord {
  const base = {
    id: db.id,
    kksCode: db.kksCode,
    equipmentDescription: db.equipmentDescription,
    date: db.date,
    preparedBy: db.preparedBy,
    doneBy: db.doneBy,
    numberOfHelpers: db.numberOfHelpers,
    reviewedBy: db.reviewedBy ?? undefined,
    reviewedAt: db.reviewedAt ? db.reviewedAt.toISOString() : undefined,
    status: db.status,
    signatureDataUrl: db.signatureDataUrl,
    remarks: db.remarks ?? undefined,
    items: db.items
      .slice()
      .sort((a, b) => a.templateItem.sortOrder - b.templateItem.sortOrder)
      .map((i) => ({ id: i.templateItem.itemKey, label: i.templateItem.label, status: i.status, note: i.note ?? undefined })),
    createdAt: db.createdAt.toISOString(),
  }

  const type = db.template.type as ChecklistType

  if (type === 'lv-ac-motor') {
    return { ...base, type, ...parseLvAcMotorReadings(db.readings) }
  }
  return { ...base, type, ...parseGeneratorReadings(db.readings, db.id) }
}

export type MeasurementsInput = ({ type: 'lv-ac-motor' } & LvAcMotorMeasurements) | ({ type: 'generator' } & GeneratorMeasurements)

export function buildReadingsForRecord(input: MeasurementsInput) {
  return input.type === 'lv-ac-motor' ? buildLvAcMotorReadings(input) : buildGeneratorReadings(input)
}
