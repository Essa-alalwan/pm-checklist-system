import type { ChecklistTemplateLogFieldDef, LogRowValue } from '../types/checklist'

export interface LogCellInput {
  groupLabel: string
  rowIndex: number
  templateLogFieldId: string
  textValue: string | null
  numericValue: number | null
}

export interface LogCellRow {
  groupLabel: string
  rowIndex: number
  templateLogFieldId: string
  textValue: string | null
  numericValue: unknown // Prisma.Decimal | null — narrowed with Number() below
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined
  const n = typeof value === 'object' && value !== null && 'toNumber' in (value as object) ? (value as { toNumber(): number }).toNumber() : Number(value)
  return Number.isFinite(n) ? n : undefined
}

// Flattens the submitted { groupLabel: row[] } shape into one cell per
// (row, field) pair — mirrors buildGenericReadings but with a rowIndex
// dimension since a log's row count isn't fixed by the template.
export function buildLogCells(fields: ChecklistTemplateLogFieldDef[], logs: Record<string, LogRowValue[]>): LogCellInput[] {
  const fieldsByGroup = new Map<string, ChecklistTemplateLogFieldDef[]>()
  for (const f of fields) {
    if (!fieldsByGroup.has(f.groupLabel)) fieldsByGroup.set(f.groupLabel, [])
    fieldsByGroup.get(f.groupLabel)!.push(f)
  }

  const cells: LogCellInput[] = []
  for (const [groupLabel, rows] of Object.entries(logs)) {
    const groupFields = fieldsByGroup.get(groupLabel) ?? []
    rows.forEach((row, rowIndex) => {
      for (const field of groupFields) {
        const raw = row[field.id]
        if (raw === undefined || raw === '') continue
        if (field.fieldType === 'text') {
          cells.push({ groupLabel, rowIndex, templateLogFieldId: field.id, textValue: String(raw), numericValue: null })
        } else if (raw === 'N/A') {
          cells.push({ groupLabel, rowIndex, templateLogFieldId: field.id, textValue: 'N/A', numericValue: null })
        } else {
          cells.push({ groupLabel, rowIndex, templateLogFieldId: field.id, textValue: null, numericValue: raw as number })
        }
      }
    })
  }
  return cells
}

// Reconstructs { groupLabel: row[] } from the flat cell rows, filling in
// every group the template defines (even with zero submitted rows).
export function parseLogCells(rows: LogCellRow[], fields: ChecklistTemplateLogFieldDef[]): Record<string, LogRowValue[]> {
  const fieldById = new Map(fields.map((f) => [f.id, f]))
  const byGroupRow = new Map<string, Map<number, LogRowValue>>()

  for (const cell of rows) {
    const field = fieldById.get(cell.templateLogFieldId)
    if (!field) continue
    if (!byGroupRow.has(cell.groupLabel)) byGroupRow.set(cell.groupLabel, new Map())
    const rowsMap = byGroupRow.get(cell.groupLabel)!
    if (!rowsMap.has(cell.rowIndex)) rowsMap.set(cell.rowIndex, {})
    const rowObj = rowsMap.get(cell.rowIndex)!
    rowObj[field.id] = field.fieldType === 'text' ? (cell.textValue ?? undefined) : cell.textValue === 'N/A' ? 'N/A' : toNumber(cell.numericValue)
  }

  const result: Record<string, LogRowValue[]> = {}
  for (const field of fields) {
    if (!(field.groupLabel in result)) result[field.groupLabel] = []
  }
  for (const [groupLabel, rowsMap] of byGroupRow) {
    const maxIndex = Math.max(...rowsMap.keys())
    const arr: LogRowValue[] = []
    for (let i = 0; i <= maxIndex; i++) arr.push(rowsMap.get(i) ?? {})
    result[groupLabel] = arr
  }
  return result
}
