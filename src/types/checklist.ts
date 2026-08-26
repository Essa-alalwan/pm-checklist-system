export type ChecklistItemStatus = 'pending' | 'done' | 'na' | 'flagged'

export interface ChecklistItemResult {
  id: string
  label: string
  status: ChecklistItemStatus
  note?: string
}

export type ChecklistType = 'lv-ac-motor' | 'generator'

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

export type ChecklistRecord = LvAcMotorChecklist | GeneratorChecklist

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
