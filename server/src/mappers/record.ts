import { Prisma } from '@prisma/client'
import type { ChecklistRecord, ChecklistTemplateLogFieldDef, ChecklistTemplateMeasurementFieldDef, ChecklistType, LogRowValue } from '../types/checklist'
import {
  buildGeneratorReadings,
  buildGenericReadings,
  buildLvAcMotorReadings,
  parseGeneratorReadings,
  parseGenericReadings,
  parseLvAcMotorReadings,
  type GeneratorMeasurements,
  type LvAcMotorMeasurements,
} from './readings'
import { buildLogCells, parseLogCells } from './logs'

export const recordInclude = Prisma.validator<Prisma.ChecklistRecordInclude>()({
  template: { include: { items: true, measurementFields: true, logFields: true } },
  items: { include: { templateItem: true } },
  readings: true,
  logCells: true,
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
  const logFieldDefs = db.template.logFields.map((f) => ({
    id: f.id,
    groupLabel: f.groupLabel,
    columnLabel: f.columnLabel,
    fieldType: f.fieldType as 'text' | 'number',
    unit: f.unit ?? undefined,
  }))
  const measurementFieldDefs = db.template.measurementFields.map((f) => ({
    id: f.id,
    groupLabel: f.groupLabel ?? undefined,
    rowLabel: f.rowLabel ?? undefined,
    columnLabel: f.columnLabel,
    unit: f.unit ?? undefined,
    fieldType: f.fieldType as 'text' | 'number',
  }))
  return {
    ...base,
    type,
    measurements: parseGenericReadings(db.readings, measurementFieldDefs),
    logs: parseLogCells(db.logCells, logFieldDefs),
  }
}

export type MeasurementsInput =
  | ({ type: 'lv-ac-motor' } & LvAcMotorMeasurements)
  | ({ type: 'generator' } & GeneratorMeasurements)
  | { type: string; measurements?: LogRowValue; logs?: Record<string, LogRowValue[]> }

export function buildReadingsForRecord(input: MeasurementsInput, measurementFields: ChecklistTemplateMeasurementFieldDef[]) {
  // `input.type` is a plain `string` on the generic union member, so TS can't
  // prove it excludes the literal types below purely from the equality check —
  // the cast is safe because the shape genuinely matches at runtime for these branches.
  if (input.type === 'lv-ac-motor') return buildLvAcMotorReadings(input as LvAcMotorMeasurements)
  if (input.type === 'generator') return buildGeneratorReadings(input as GeneratorMeasurements)
  const generic = input as { measurements?: LogRowValue }
  return buildGenericReadings(measurementFields, generic.measurements ?? {})
}

// Only custom (non-built-in) types can have logs — lv-ac-motor/generator
// never carry a `logs` field, matching how they never carry `measurements`.
export function buildLogCellsForRecord(input: MeasurementsInput, logFields: ChecklistTemplateLogFieldDef[]) {
  if (input.type === 'lv-ac-motor' || input.type === 'generator') return []
  const generic = input as { logs?: Record<string, LogRowValue[]> }
  return buildLogCells(logFields, generic.logs ?? {})
}
