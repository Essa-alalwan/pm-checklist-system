// Shared plain-TS shapes produced by the docx parser (parseChecklistDocx.ts,
// classifyTable.ts). Deliberately zod-free — validation lives in the route
// layer (server/src/schemas/templateFields.ts), parsing logic here just
// produces data. Mirrors the *shape* of ChecklistTemplateMeasurementFieldDef/
// ChecklistTemplateLogFieldDef (server/src/types/checklist.ts) minus `id`,
// since nothing here is persisted yet — it's a suggestion for a human to
// review, edit, and explicitly accept before it becomes a real field.

export interface DetectedMeasurementField {
  groupLabel: string
  rowLabel?: string
  columnLabel: string
  unit?: string
  fieldType: 'text' | 'number'
}

export interface DetectedLogField {
  groupLabel: string
  columnLabel: string
  fieldType: 'text' | 'number'
  unit?: string
}

export interface DetectedItem {
  text: string
  source: 'list' | 'table'
  sourceTableIndex?: number
}

export type TableClassificationKind = 'grid' | 'log' | 'skipped-reference' | 'skipped-header' | 'ambiguous'

export interface DetectedTableGroup {
  sourceTableIndex: number
  classification: TableClassificationKind
  groupLabel: string
  measurementFields?: DetectedMeasurementField[] // present only when classification === 'grid'
  logFields?: DetectedLogField[] // present only when classification === 'log'
  // A small raw excerpt of the table (first few matrix rows, as plain text
  // cells) so a human can sanity-check a skipped/ambiguous table in the
  // review UI without re-opening the source document.
  previewRows: string[][]
}

export interface ParsedChecklist {
  suggestedLabel: string
  suggestedDescription: string
  items: DetectedItem[]
  tableGroups: DetectedTableGroup[]
}
