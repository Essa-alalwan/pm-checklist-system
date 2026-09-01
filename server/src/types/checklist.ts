// Mirrors src/types/checklist.ts on the frontend. Kept as a plain duplicate
// (no shared package) since this is a small two-project setup — the shapes
// below are what the API sends/receives over the wire and must stay in sync
// with the frontend's ChecklistRecord union.

export type ChecklistItemStatus = 'done' | 'na' | 'flagged'

// A measurement value: a real number, or 'N/A' when a technician can't get a
// reading (equipment not fitted with that test point, sensor unavailable, etc).
export type NumericOrNA = number | 'N/A'

export interface ChecklistItemResult {
  id: string
  label: string
  status: ChecklistItemStatus
  note?: string
}

// The two built-in types have bespoke measurement UI; any other value is a
// supervisor-uploaded checklist type with items only (no measurements).
export const BUILT_IN_CHECKLIST_TYPES = ['lv-ac-motor', 'generator'] as const
export type BuiltInChecklistType = (typeof BUILT_IN_CHECKLIST_TYPES)[number]
export type ChecklistType = string
export type ChecklistRecordStatus = 'submitted' | 'reviewed'

export interface ChecklistBase {
  id: string
  type: ChecklistType
  kksCode: string
  equipmentDescription: string
  date: string
  preparedBy: string
  doneBy: string
  numberOfHelpers: number
  reviewedBy?: string
  reviewedAt?: string
  status: ChecklistRecordStatus
  signatureDataUrl: string
  remarks?: string
  items: ChecklistItemResult[]
  createdAt: string
  createdByUserId: string
}

export interface WindingResistanceRow {
  phase: 'R-Y' | 'Y-B' | 'R-B'
  resistanceOhm?: NumericOrNA
  inductanceMh?: NumericOrNA
}

export interface LvAcMotorChecklist extends ChecklistBase {
  type: 'lv-ac-motor'
  windingResistance: WindingResistanceRow[]
  spaceHeaterResistanceOhm?: NumericOrNA
  spaceHeaterInsulationMOhm?: NumericOrNA
  phaseToEarthInsulationMOhm?: NumericOrNA
  ambientTempC?: NumericOrNA
  humidityPercent?: NumericOrNA
}

export interface ShaftGroundingBrush {
  holderNumber: number
  lengthMm?: NumericOrNA
}

export interface BrushLengthRow {
  id: string
  holderNumber: number
  side: string
  lengthMm?: NumericOrNA
}

export interface GeneratorChecklist extends ChecklistBase {
  type: 'generator'
  shaftGroundingBrushes: ShaftGroundingBrush[]
  brushLengths: BrushLengthRow[]
  h2PressureBar?: NumericOrNA
  ipbPressureBar?: NumericOrNA
  ipbTempC?: NumericOrNA
  ipbHumidityPercent?: NumericOrNA
  gtRunningHours?: NumericOrNA
}

// One row a technician added to a repeatable-row log, keyed by the log
// field's own id. A text column holds a plain string; a number column holds
// a NumericOrNA (same "N/A" convention as fixed measurement fields).
export type LogRowValue = Record<string, string | NumericOrNA | undefined>

// A supervisor-uploaded checklist type: base sign-off fields + items, plus
// whatever measurement fields and log tables the template defines (empty
// for items-only types). `type` is guaranteed to NOT be one of
// BUILT_IN_CHECKLIST_TYPES.
export interface GenericChecklist extends ChecklistBase {
  type: string
  measurements: LogRowValue
  logs: Record<string, LogRowValue[]>
}

export type ChecklistRecord = LvAcMotorChecklist | GeneratorChecklist | GenericChecklist

export interface ChecklistTemplateItemDef {
  id: string
  label: string
}

// One fillable measurement cell on a custom checklist type. See
// ChecklistTemplateMeasurementField in schema.prisma for the pivot rules:
// fields sharing a groupLabel render together; more than one distinct
// rowLabel in a group makes it a real table, otherwise it's a flat field list.
export interface ChecklistTemplateMeasurementFieldDef {
  id: string
  groupLabel?: string
  rowLabel?: string
  columnLabel: string
  unit?: string
  fieldType: 'text' | 'number'
}

// A column definition for a repeatable-row log table — for source tables
// whose row count isn't fixed. A template can define more than one log,
// distinguished by groupLabel.
export interface ChecklistTemplateLogFieldDef {
  id: string
  groupLabel: string
  columnLabel: string
  fieldType: 'text' | 'number'
  unit?: string
}

export interface ChecklistTemplateDef {
  type: ChecklistType
  label: string
  shortLabel: string
  description: string
  items: ChecklistTemplateItemDef[]
  measurementFields: ChecklistTemplateMeasurementFieldDef[]
  logFields: ChecklistTemplateLogFieldDef[]
}
