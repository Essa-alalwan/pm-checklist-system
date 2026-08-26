import type { GeneratorChecklist, LvAcMotorChecklist } from '../../types/checklist'
import { generatorTemplate } from '../../data/templates/generator'
import { lvAcMotorTemplate } from '../../data/templates/lvAcMotor'

export type LvAcMotorDraft = Omit<LvAcMotorChecklist, 'id' | 'createdAt' | 'status'>
export type GeneratorDraft = Omit<GeneratorChecklist, 'id' | 'createdAt' | 'status'>
export type ChecklistDraft = LvAcMotorDraft | GeneratorDraft

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createEmptyLvAcMotorDraft(doneBy = ''): LvAcMotorDraft {
  return {
    type: 'lv-ac-motor',
    kksCode: '',
    equipmentDescription: '',
    date: today(),
    preparedBy: '',
    doneBy,
    numberOfHelpers: 0,
    reviewedBy: undefined,
    signatureDataUrl: '',
    remarks: '',
    items: lvAcMotorTemplate.items.map((i) => ({ id: i.id, label: i.label, status: 'pending' as const, note: undefined })),
    windingResistance: [
      { phase: 'R-Y', resistanceOhm: undefined, inductanceMh: undefined },
      { phase: 'Y-B', resistanceOhm: undefined, inductanceMh: undefined },
      { phase: 'R-B', resistanceOhm: undefined, inductanceMh: undefined },
    ],
    spaceHeaterResistanceOhm: undefined,
    spaceHeaterInsulationMOhm: undefined,
    phaseToEarthInsulationMOhm: undefined,
    ambientTempC: undefined,
    humidityPercent: undefined,
  }
}

export function createEmptyGeneratorDraft(doneBy = ''): GeneratorDraft {
  return {
    type: 'generator',
    kksCode: '',
    equipmentDescription: '',
    date: today(),
    preparedBy: '',
    doneBy,
    numberOfHelpers: 0,
    reviewedBy: undefined,
    signatureDataUrl: '',
    remarks: '',
    items: generatorTemplate.items.map((i) => ({ id: i.id, label: i.label, status: 'pending' as const, note: undefined })),
    shaftGroundingBrushes: [1, 2, 3, 4].map((holderNumber) => ({ holderNumber, lengthMm: undefined })),
    brushLengths: [],
    h2PressureBar: undefined,
    ipbPressureBar: undefined,
    ipbTempC: undefined,
    ipbHumidityPercent: undefined,
    gtRunningHours: undefined,
  }
}
