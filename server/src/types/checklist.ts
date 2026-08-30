// Mirrors src/types/checklist.ts on the frontend. Kept as a plain duplicate
// (no shared package) since this is a small two-project setup — the shapes
// below are what the API sends/receives over the wire and must stay in sync
// with the frontend's ChecklistRecord union.

export type ChecklistItemStatus = 'done' | 'na' | 'flagged'

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
  resistanceOhm?: number
  inductanceMh?: number
}

export interface LvAcMotorChecklist extends ChecklistBase {
  type: 'lv-ac-motor'
  windingResistance: WindingResistanceRow[]
  spaceHeaterResistanceOhm?: number
  spaceHeaterInsulationMOhm?: number
  phaseToEarthInsulationMOhm?: number
  ambientTempC?: number
  humidityPercent?: number
}

export interface ShaftGroundingBrush {
  holderNumber: number
  lengthMm?: number
}

export interface BrushLengthRow {
  id: string
  holderNumber: number
  side: string
  lengthMm?: number
}

export interface GeneratorChecklist extends ChecklistBase {
  type: 'generator'
  shaftGroundingBrushes: ShaftGroundingBrush[]
  brushLengths: BrushLengthRow[]
  h2PressureBar?: number
  ipbPressureBar?: number
  ipbTempC?: number
  ipbHumidityPercent?: number
  gtRunningHours?: number
}

// A supervisor-uploaded checklist type: base sign-off fields + items, nothing
// type-specific. `type` is guaranteed to NOT be one of BUILT_IN_CHECKLIST_TYPES.
export interface GenericChecklist extends ChecklistBase {
  type: string
}

export type ChecklistRecord = LvAcMotorChecklist | GeneratorChecklist | GenericChecklist

export interface ChecklistTemplateItemDef {
  id: string
  label: string
}

export interface ChecklistTemplateDef {
  type: ChecklistType
  label: string
  shortLabel: string
  description: string
  items: ChecklistTemplateItemDef[]
}
