import type { ChecklistTemplateItemDef, GeneratorChecklist, GenericChecklist, LvAcMotorChecklist, ChecklistType } from '../../types/checklist'

export type LvAcMotorDraft = Omit<LvAcMotorChecklist, 'id' | 'createdAt' | 'status' | 'createdByUserId'>
export type GeneratorDraft = Omit<GeneratorChecklist, 'id' | 'createdAt' | 'status' | 'createdByUserId'>
export type GenericDraft = Omit<GenericChecklist, 'id' | 'createdAt' | 'status' | 'createdByUserId'>
export type ChecklistDraft = LvAcMotorDraft | GeneratorDraft | GenericDraft

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createEmptyLvAcMotorDraft(templateItems: ChecklistTemplateItemDef[], doneBy = '', signatureDataUrl = ''): LvAcMotorDraft {
  return {
    type: 'lv-ac-motor',
    kksCode: '',
    equipmentDescription: '',
    date: today(),
    preparedBy: '',
    doneBy,
    numberOfHelpers: 0,
    reviewedBy: undefined,
    signatureDataUrl,
    remarks: '',
    items: templateItems.map((i) => ({ id: i.id, label: i.label, status: 'pending' as const, note: undefined })),
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

export function createEmptyGeneratorDraft(templateItems: ChecklistTemplateItemDef[], doneBy = '', signatureDataUrl = ''): GeneratorDraft {
  return {
    type: 'generator',
    kksCode: '',
    equipmentDescription: '',
    date: today(),
    preparedBy: '',
    doneBy,
    numberOfHelpers: 0,
    reviewedBy: undefined,
    signatureDataUrl,
    remarks: '',
    items: templateItems.map((i) => ({ id: i.id, label: i.label, status: 'pending' as const, note: undefined })),
    shaftGroundingBrushes: [1, 2, 3, 4].map((holderNumber) => ({ holderNumber, lengthMm: undefined })),
    brushLengths: [],
    h2PressureBar: undefined,
    ipbPressureBar: undefined,
    ipbTempC: undefined,
    ipbHumidityPercent: undefined,
    gtRunningHours: undefined,
  }
}

export function createEmptyGenericDraft(
  type: ChecklistType,
  templateItems: ChecklistTemplateItemDef[],
  doneBy = '',
  signatureDataUrl = '',
): GenericDraft {
  return {
    type,
    kksCode: '',
    equipmentDescription: '',
    date: today(),
    preparedBy: '',
    doneBy,
    numberOfHelpers: 0,
    reviewedBy: undefined,
    signatureDataUrl,
    remarks: '',
    items: templateItems.map((i) => ({ id: i.id, label: i.label, status: 'pending' as const, note: undefined })),
  }
}
