import type { ChecklistTemplateMeasurementFieldDef, GeneratorChecklist, LogRowValue, LvAcMotorChecklist, NumericOrNA } from '../types/checklist'

export interface ReadingInput {
  key: string
  groupLabel: string | null
  value: number | null
  textValue: string | null
  unit: string | null
  sortOrder: number
}

export interface ReadingRow {
  key: string
  groupLabel: string | null
  value: unknown // Prisma.Decimal | null — narrowed with Number() below
  textValue: string | null
  unit: string | null
  sortOrder: number
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const n = typeof value === 'object' && value !== null && 'toNumber' in (value as object) ? (value as { toNumber(): number }).toNumber() : Number(value)
  return Number.isFinite(n) ? n : undefined
}

// Splits a measurement value into the two columns it's actually stored in —
// a real number goes in `value` (a true Postgres numeric, chartable later),
// "N/A" goes in `textValue` instead, and an unset field leaves both null.
function splitNumericOrNA(input: NumericOrNA | undefined): { value: number | null; textValue: string | null } {
  if (input === undefined) return { value: null, textValue: null }
  if (input === 'N/A') return { value: null, textValue: 'N/A' }
  return { value: input, textValue: null }
}

function readNumericOrNA(row: { value: unknown; textValue: string | null } | undefined): NumericOrNA | undefined {
  if (!row) return undefined
  if (row.textValue === 'N/A') return 'N/A'
  return toNumber(row.value)
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
    readings.push({ key: 'windingResistance.resistanceOhm', groupLabel: row.phase, ...splitNumericOrNA(row.resistanceOhm), unit: 'Ω', sortOrder: sortOrder++ })
    readings.push({ key: 'windingResistance.inductanceMh', groupLabel: row.phase, ...splitNumericOrNA(row.inductanceMh), unit: 'mH', sortOrder: sortOrder++ })
  }

  readings.push({ key: 'spaceHeaterResistanceOhm', groupLabel: null, ...splitNumericOrNA(input.spaceHeaterResistanceOhm), unit: 'Ω', sortOrder: sortOrder++ })
  readings.push({ key: 'spaceHeaterInsulationMOhm', groupLabel: null, ...splitNumericOrNA(input.spaceHeaterInsulationMOhm), unit: 'MΩ', sortOrder: sortOrder++ })
  readings.push({ key: 'phaseToEarthInsulationMOhm', groupLabel: null, ...splitNumericOrNA(input.phaseToEarthInsulationMOhm), unit: 'MΩ', sortOrder: sortOrder++ })
  readings.push({ key: 'ambientTempC', groupLabel: null, ...splitNumericOrNA(input.ambientTempC), unit: '°C', sortOrder: sortOrder++ })
  readings.push({ key: 'humidityPercent', groupLabel: null, ...splitNumericOrNA(input.humidityPercent), unit: '%', sortOrder: sortOrder++ })

  return readings
}

export function parseLvAcMotorReadings(rows: ReadingRow[]): LvAcMotorMeasurements {
  const byKeyAndGroup = new Map<string, ReadingRow>()
  for (const r of rows) byKeyAndGroup.set(`${r.key}::${r.groupLabel ?? ''}`, r)

  const windingResistance = WINDING_PHASES.map((phase) => ({
    phase,
    resistanceOhm: readNumericOrNA(byKeyAndGroup.get(`windingResistance.resistanceOhm::${phase}`)),
    inductanceMh: readNumericOrNA(byKeyAndGroup.get(`windingResistance.inductanceMh::${phase}`)),
  }))

  const find = (key: string) => readNumericOrNA(byKeyAndGroup.get(`${key}::`))

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
      ...splitNumericOrNA(brush.lengthMm),
      unit: 'mm',
      sortOrder: sortOrder++,
    })
  }

  for (const row of input.brushLengths) {
    readings.push({
      key: 'brushLengthMm',
      groupLabel: `Holder ${row.holderNumber} ${row.side}`,
      ...splitNumericOrNA(row.lengthMm),
      unit: 'mm',
      sortOrder: sortOrder++,
    })
  }

  readings.push({ key: 'h2PressureBar', groupLabel: null, ...splitNumericOrNA(input.h2PressureBar), unit: 'bar', sortOrder: sortOrder++ })
  readings.push({ key: 'ipbPressureBar', groupLabel: null, ...splitNumericOrNA(input.ipbPressureBar), unit: 'bar', sortOrder: sortOrder++ })
  readings.push({ key: 'ipbTempC', groupLabel: null, ...splitNumericOrNA(input.ipbTempC), unit: '°C', sortOrder: sortOrder++ })
  readings.push({ key: 'ipbHumidityPercent', groupLabel: null, ...splitNumericOrNA(input.ipbHumidityPercent), unit: '%', sortOrder: sortOrder++ })
  readings.push({ key: 'gtRunningHours', groupLabel: null, ...splitNumericOrNA(input.gtRunningHours), unit: 'hrs', sortOrder: sortOrder++ })

  return readings
}

export function parseGeneratorReadings(rows: ReadingRow[], recordId: string): GeneratorMeasurements {
  const shaftGroundingBrushes = rows
    .filter((r) => r.key === 'shaftGroundingBrushLengthMm')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({
      holderNumber: Number(r.groupLabel?.replace('Holder ', '')) || 0,
      lengthMm: readNumericOrNA(r),
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
        lengthMm: readNumericOrNA(r),
      }
    })

  const find = (key: string) => readNumericOrNA(rows.find((r) => r.key === key))

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

// Custom checklist types (anything not lv-ac-motor/generator) have no named
// struct fields — the template itself defines what fields exist. `key` is
// the ChecklistTemplateMeasurementField's own id, so no name collisions are
// possible across fields/groups the way there would be with a shared string key.
// A field's own fieldType decides how its value is stored: 'text' fields go
// straight into textValue as-is (no NumericOrNA "N/A" semantics), 'number'
// fields use the same split every other measurement uses.
export function buildGenericReadings(fields: ChecklistTemplateMeasurementFieldDef[], measurements: LogRowValue): ReadingInput[] {
  return fields.map((field, index) => {
    const raw = measurements[field.id]
    return {
      key: field.id,
      groupLabel: field.groupLabel ?? null,
      unit: field.unit ?? null,
      sortOrder: index,
      ...(field.fieldType === 'text' ? { value: null, textValue: raw === undefined ? null : String(raw) } : splitNumericOrNA(raw as NumericOrNA | undefined)),
    }
  })
}

export function parseGenericReadings(rows: ReadingRow[], fields: ChecklistTemplateMeasurementFieldDef[]): LogRowValue {
  const fieldById = new Map(fields.map((f) => [f.id, f]))
  const result: LogRowValue = {}
  for (const row of rows) {
    const field = fieldById.get(row.key)
    if (field?.fieldType === 'text') {
      if (row.textValue !== null) result[row.key] = row.textValue
      continue
    }
    const value = readNumericOrNA(row)
    if (value !== undefined) result[row.key] = value
  }
  return result
}
