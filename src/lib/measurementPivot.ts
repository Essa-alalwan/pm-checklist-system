import type { ChecklistTemplateMeasurementFieldDef } from '../types/checklist'

// Mirrors server/src/measurements/pivot.ts — turns a template's flat list of
// measurement field definitions into renderable groups. Shared logic behind
// the wizard step, the read-only view, and the PDF, so all render the exact
// same table/flat-list split from the exact same rule:
//   - fields sharing a groupLabel render together under one heading
//   - more than one distinct rowLabel in a group -> a real row x column table
//   - otherwise -> a flat list of labeled fields (one per columnLabel)

export interface MeasurementTableGroup {
  kind: 'table'
  groupLabel: string
  rows: string[]
  columns: string[]
  cellsByKey: Map<string, ChecklistTemplateMeasurementFieldDef>
}

export interface MeasurementFlatGroup {
  kind: 'flat'
  groupLabel: string
  fields: ChecklistTemplateMeasurementFieldDef[]
}

export type MeasurementGroup = MeasurementTableGroup | MeasurementFlatGroup

const UNGROUPED_LABEL = 'Measurements'

export function tableCellKey(rowLabel: string, columnLabel: string): string {
  return `${rowLabel}::${columnLabel}`
}

export function groupMeasurementFields(fields: ChecklistTemplateMeasurementFieldDef[]): MeasurementGroup[] {
  const groupOrder: string[] = []
  const byGroup = new Map<string, ChecklistTemplateMeasurementFieldDef[]>()

  for (const field of fields) {
    const groupLabel = field.groupLabel ?? UNGROUPED_LABEL
    if (!byGroup.has(groupLabel)) {
      byGroup.set(groupLabel, [])
      groupOrder.push(groupLabel)
    }
    byGroup.get(groupLabel)!.push(field)
  }

  return groupOrder.map((groupLabel) => {
    const groupFields = byGroup.get(groupLabel)!
    const rowOrder: string[] = []
    for (const f of groupFields) {
      const row = f.rowLabel ?? ''
      if (!rowOrder.includes(row)) rowOrder.push(row)
    }

    if (rowOrder.length <= 1) {
      return { kind: 'flat', groupLabel, fields: groupFields } satisfies MeasurementFlatGroup
    }

    const columnOrder: string[] = []
    for (const f of groupFields) {
      if (!columnOrder.includes(f.columnLabel)) columnOrder.push(f.columnLabel)
    }
    const cellsByKey = new Map<string, ChecklistTemplateMeasurementFieldDef>()
    for (const f of groupFields) {
      cellsByKey.set(tableCellKey(f.rowLabel ?? '', f.columnLabel), f)
    }

    return { kind: 'table', groupLabel, rows: rowOrder, columns: columnOrder, cellsByKey } satisfies MeasurementTableGroup
  })
}
