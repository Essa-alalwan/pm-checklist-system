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
    createdByUserId: db.createdByUserId,
  }

  const type = db.template.type as ChecklistType

  if (type === 'lv-ac-motor') {
    return { ...base, type, ...parseLvAcMotorReadings(db.readings) }
  }
  if (type === 'generator') {
    return { ...base, type, ...parseGeneratorReadings(db.readings, db.id) }
  }
  return { ...base, type }
}

export type MeasurementsInput =
  | ({ type: 'lv-ac-motor' } & LvAcMotorMeasurements)
  | ({ type: 'generator' } & GeneratorMeasurements)
  | { type: string }

export function buildReadingsForRecord(input: MeasurementsInput) {
  // `input.type` is a plain `string` on the generic union member, so TS can't
  // prove it excludes the literal types below purely from the equality check —
  // the cast is safe because the shape genuinely matches at runtime for these branches.
  if (input.type === 'lv-ac-motor') return buildLvAcMotorReadings(input as LvAcMotorMeasurements)
  if (input.type === 'generator') return buildGeneratorReadings(input as GeneratorMeasurements)
  return []
}
