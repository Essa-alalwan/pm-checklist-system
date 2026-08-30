export type ChecklistItemStatus = 'pending' | 'done' | 'na' | 'flagged'

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

// A supervisor-uploaded checklist type: base sign-off fields + items, nothing
// type-specific. `type` is guaranteed to NOT be one of BUILT_IN_CHECKLIST_TYPES.
export interface GenericChecklist extends ChecklistBase {
  type: string
}

export type ChecklistRecord = LvAcMotorChecklist | GeneratorChecklist | GenericChecklist

// What the client sends to create a record — the server assigns id/createdAt/status.
export type ChecklistCreateInput = Omit<ChecklistRecord, 'id' | 'createdAt' | 'status'>

export interface ChecklistTemplateItemDef {
  id: string
  label: string
}

export interface ChecklistTemplate {
  type: ChecklistType
  label: string
  shortLabel: string
  description: string
  items: ChecklistTemplateItemDef[]
}
