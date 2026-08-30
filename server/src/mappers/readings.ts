import type { GeneratorChecklist, LvAcMotorChecklist } from '../types/checklist'

export interface ReadingInput {
  key: string
  groupLabel: string | null
  value: number | null
  unit: string | null
  sortOrder: number
}

export interface ReadingRow {
  key: string
  groupLabel: string | null
  value: unknown // Prisma.Decimal | null — narrowed with Number() below
  unit: string | null
  sortOrder: number
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const n = typeof value === 'object' && value !== null && 'toNumber' in (value as object) ? (value as { toNumber(): number }).toNumber() : Number(value)
  return Number.isFinite(n) ? n : undefined
}

const WINDING_PHASES = ['R-Y', 'Y-B', 'R-B'] as const

export type LvAcMotorMeasurements = Pick<
  LvAcMotorChecklist,
  'windingResistance' | 'spaceHeaterResistanceOhm' | 'spaceHeaterInsulationMOhm' | 'phaseToEarthInsulationMOhm' | 'ambientTempC' | 'humidityPercent'
>

export function buildLvAcMotorReadings(input: LvAcMotorMeasurements): ReadingInput[] {
  const readings: ReadingInput[] = []
  let sortOrder = 0

  for (const row of input.windingResistance) {
    readings.push({ key: 'windingResistance.resistanceOhm', groupLabel: row.phase, value: row.resistanceOhm ?? null, unit: 'Ω', sortOrder: sortOrder++ })
    readings.push({ key: 'windingResistance.inductanceMh', groupLabel: row.phase, value: row.inductanceMh ?? null, unit: 'mH', sortOrder: sortOrder++ })
  }

  readings.push({ key: 'spaceHeaterResistanceOhm', groupLabel: null, value: input.spaceHeaterResistanceOhm ?? null, unit: 'Ω', sortOrder: sortOrder++ })
  readings.push({ key: 'spaceHeaterInsulationMOhm', groupLabel: null, value: input.spaceHeaterInsulationMOhm ?? null, unit: 'MΩ', sortOrder: sortOrder++ })
  readings.push({ key: 'phaseToEarthInsulationMOhm', groupLabel: null, value: input.phaseToEarthInsulationMOhm ?? null, unit: 'MΩ', sortOrder: sortOrder++ })
  readings.push({ key: 'ambientTempC', groupLabel: null, value: input.ambientTempC ?? null, unit: '°C', sortOrder: sortOrder++ })
  readings.push({ key: 'humidityPercent', groupLabel: null, value: input.humidityPercent ?? null, unit: '%', sortOrder: sortOrder++ })

  return readings
}

export function parseLvAcMotorReadings(rows: ReadingRow[]): LvAcMotorMeasurements {
  const byKeyAndGroup = new Map<string, ReadingRow>()
  for (const r of rows) byKeyAndGroup.set(`${r.key}::${r.groupLabel ?? ''}`, r)

  const windingResistance = WINDING_PHASES.map((phase) => ({
    phase,
    resistanceOhm: toNumber(byKeyAndGroup.get(`windingResistance.resistanceOhm::${phase}`)?.value),
    inductanceMh: toNumber(byKeyAndGroup.get(`windingResistance.inductanceMh::${phase}`)?.value),
  }))

  const find = (key: string) => toNumber(byKeyAndGroup.get(`${key}::`)?.value)

  return {
    windingResistance,
    spaceHeaterResistanceOhm: find('spaceHeaterResistanceOhm'),
    spaceHeaterInsulationMOhm: find('spaceHeaterInsulationMOhm'),
    phaseToEarthInsulationMOhm: find('phaseToEarthInsulationMOhm'),
    ambientTempC: find('ambientTempC'),
    humidityPercent: find('humidityPercent'),
  }
}

export type GeneratorMeasurements = Pick<
  GeneratorChecklist,
  'shaftGroundingBrushes' | 'brushLengths' | 'h2PressureBar' | 'ipbPressureBar' | 'ipbTempC' | 'ipbHumidityPercent' | 'gtRunningHours'
>

const BRUSH_ROW_LABEL = /^Holder (\d+) (.+)$/

export function buildGeneratorReadings(input: GeneratorMeasurements): ReadingInput[] {
  const readings: ReadingInput[] = []
  let sortOrder = 0

  for (const brush of input.shaftGroundingBrushes) {
    readings.push({
      key: 'shaftGroundingBrushLengthMm',
      groupLabel: `Holder ${brush.holderNumber}`,
      value: brush.lengthMm ?? null,
      unit: 'mm',
      sortOrder: sortOrder++,
    })
  }

  for (const row of input.brushLengths) {
    readings.push({
      key: 'brushLengthMm',
      groupLabel: `Holder ${row.holderNumber} ${row.side}`,
      value: row.lengthMm ?? null,
      unit: 'mm',
      sortOrder: sortOrder++,
    })
  }

  readings.push({ key: 'h2PressureBar', groupLabel: null, value: input.h2PressureBar ?? null, unit: 'bar', sortOrder: sortOrder++ })
  readings.push({ key: 'ipbPressureBar', groupLabel: null, value: input.ipbPressureBar ?? null, unit: 'bar', sortOrder: sortOrder++ })
  readings.push({ key: 'ipbTempC', groupLabel: null, value: input.ipbTempC ?? null, unit: '°C', sortOrder: sortOrder++ })
  readings.push({ key: 'ipbHumidityPercent', groupLabel: null, value: input.ipbHumidityPercent ?? null, unit: '%', sortOrder: sortOrder++ })
  readings.push({ key: 'gtRunningHours', groupLabel: null, value: input.gtRunningHours ?? null, unit: 'hrs', sortOrder: sortOrder++ })

  return readings
}

export function parseGeneratorReadings(rows: ReadingRow[], recordId: string): GeneratorMeasurements {
  const shaftGroundingBrushes = rows
    .filter((r) => r.key === 'shaftGroundingBrushLengthMm')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({
      holderNumber: Number(r.groupLabel?.replace('Holder ', '')) || 0,
      lengthMm: toNumber(r.value),
    }))

  const brushLengths = rows
    .filter((r) => r.key === 'brushLengthMm')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r, index) => {
      const match = r.groupLabel?.match(BRUSH_ROW_LABEL)
      return {
        id: `${recordId}-brush-${index}`,
        holderNumber: match ? Number(match[1]) : 0,
        side: match ? match[2] : '',
        lengthMm: toNumber(r.value),
      }
    })

  const find = (key: string) => toNumber(rows.find((r) => r.key === key)?.value)

  return {
    shaftGroundingBrushes,
    brushLengths,
    h2PressureBar: find('h2PressureBar'),
    ipbPressureBar: find('ipbPressureBar'),
    ipbTempC: find('ipbTempC'),
    ipbHumidityPercent: find('ipbHumidityPercent'),
    gtRunningHours: find('gtRunningHours'),
  }
}
