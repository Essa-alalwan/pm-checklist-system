import type { TableMatrix } from './tableExtraction'
import type { DetectedLogField, DetectedMeasurementField } from './parsedChecklistTypes'
import { cleanItemText, isPlaceholderCell, isRealSentence } from './textUtils'

export type TableClassification =
  | { kind: 'items'; items: string[] }
  | { kind: 'grid'; groupLabel: string; measurementFields: DetectedMeasurementField[] }
  | { kind: 'log'; groupLabel: string; logFields: DetectedLogField[] }
  | { kind: 'skipped-reference' }
  | { kind: 'skipped-header' }
  | { kind: 'ambiguous' }

// Standard job-info blanks every source form repeats — if a small table is
// mostly made of these, it's the app's own built-in KKS/Prepared-By/etc.
// fields, not real content to model.
const HEADER_KEYWORDS = /^(kks|date|prepared by|done by|reviewed by|description|comments?|page|number of helpers|technician signature|equipment)\b/i

// Tokens that mark a column header as carrying a numeric reading (units, or
// the bare word for one) vs. a qualitative/free-text column.
const NUMBER_UNIT_HINT = /(mv|m[Ωω]|[Ωω]|ohm|°c|bar|mm|%|hrs?|hours?|k[Ωω]|volt|amps?|hz|pc\b|db\b|kv\b|v\b|a\b)/i
const NUMERIC_CELL = /^-?\d+(\.\d+)?$/

function textOf(matrix: TableMatrix, r: number, c: number): string {
  return matrix[r]?.[c]?.text ?? ''
}

// A full-width title row above the real column headers — a single cell
// colspan'd across the whole table (e.g. "Medium Voltage (MV) Cable
// Accessories (6.6kV to 36kV)" sitting above a real PILC/XLPE/Assessment
// header row). Detected by every cell in the row sharing identical text
// (colspan expansion copies the origin cell's text into its continuation
// cells) — a genuine header row has distinct text per column instead.
function stripCaptionRow(matrix: TableMatrix): { matrix: TableMatrix; caption?: string } {
  if (matrix.length < 3 || matrix[0].length < 2) return { matrix }
  const first = matrix[0]
  const text = first[0]?.text.trim()
  if (!text) return { matrix }
  const allSame = first.every((cell) => cell.text.trim() === text)
  if (!allSame) return { matrix }
  return { matrix: matrix.slice(1), caption: text }
}

function guessFieldType(headerText: string, sampleCells: string[]): 'text' | 'number' {
  if (NUMBER_UNIT_HINT.test(headerText)) return 'number'
  const nonEmpty = sampleCells.map((c) => c.trim()).filter(Boolean)
  if (nonEmpty.length === 0) return 'number'
  const numericCount = nonEmpty.filter((c) => NUMERIC_CELL.test(c)).length
  return numericCount / nonEmpty.length >= 0.6 ? 'number' : 'text'
}

// A header often embeds its unit in trailing parens, e.g. "IR 1min (MΩ)" —
// split it out so columnLabel stays clean and unit is usable on its own.
function splitUnit(headerText: string): { columnLabel: string; unit?: string } {
  const match = headerText.match(/^(.*)\(([^()]{1,12})\)\s*$/)
  if (!match) return { columnLabel: headerText }
  const [, base, unit] = match
  if (!/[a-zA-Z%°Ωω]/.test(unit)) return { columnLabel: headerText }
  return { columnLabel: base.trim() || headerText, unit: unit.trim() }
}

function classifyAsItemsTable(matrix: TableMatrix): string[] | null {
  if (matrix.length === 0) return null
  const width = matrix[0].length
  if (width < 2 || width > 5) return null // items tables in this project are narrow: text + a placeholder/status column, maybe an index column

  const items: string[] = []
  let qualifyingRows = 0
  let candidateRows = 0

  for (const row of matrix) {
    const nonEmptyCells = row.filter((cell) => cell.text.trim() !== '')
    if (nonEmptyCells.length === 0) continue
    candidateRows += 1

    const longTextCells = row.filter((cell) => isRealSentence(cell.text))
    const otherCells = row.filter((cell) => !isRealSentence(cell.text))
    const otherCellsLookLikeStatus = otherCells.every((cell) => isPlaceholderCell(cell.text) || /^\d{1,3}$/.test(cell.text.trim()))

    if (longTextCells.length === 1 && otherCellsLookLikeStatus) {
      qualifyingRows += 1
      const text = cleanItemText(longTextCells[0].text)
      if (isRealSentence(text)) items.push(text)
    }
  }

  if (candidateRows === 0) return null
  // Require most of the table's real rows to fit the pattern, and require at
  // least one usable item — otherwise this isn't really an items table.
  if (qualifyingRows === 0 || qualifyingRows / candidateRows < 0.6) return null
  return items
}

export function classifyTable(matrix: TableMatrix, tableIndex: number): TableClassification {
  if (matrix.length === 0 || matrix[0].length === 0) return { kind: 'skipped-header' }

  // Small, keyword-dense tables are the paper form's own job-info header
  // (KKS:/Date:/Prepared By: etc.) — the app already has built-in fields for
  // these, nothing to model.
  const allCells = matrix.flat()
  const nonEmptyCells = allCells.filter((c) => c.text.trim() !== '')
  if (matrix.length <= 3 && nonEmptyCells.length > 0 && nonEmptyCells.length <= 10) {
    const keywordMatches = nonEmptyCells.filter((c) => HEADER_KEYWORDS.test(c.text.trim())).length
    if (keywordMatches / nonEmptyCells.length >= 0.4) return { kind: 'skipped-header' }
  }

  const itemsResult = classifyAsItemsTable(matrix)
  if (itemsResult && itemsResult.length > 0) return { kind: 'items', items: itemsResult }

  // A full-width caption/title row (e.g. "Medium Voltage (MV) Cable
  // Accessories") sitting above the real column-header row would otherwise
  // get mistaken for the header itself — strip it first and fold it into
  // the group label so the real header/data-row split below is correct.
  const { matrix: body, caption } = stripCaptionRow(matrix)
  const groupLabel = caption ? caption.slice(0, 60) : `Table ${tableIndex + 1}`

  // Everything past this point treats row 0 as the header row and column 0
  // as the row-key column, per the grid/log/reference distinction learned
  // from hand-authoring ~55 real documents this session.
  const width = body[0].length
  const dataRows = body.slice(1)

  if (width < 2) return { kind: 'ambiguous' }

  if (dataRows.length === 0) {
    // Header-only table, no data rows at all — an open register whose row
    // count varies visit to visit (nothing was ever pre-listed).
    return { kind: 'log', groupLabel, logFields: buildLogFields(body, groupLabel) }
  }

  const rowKeyCells = dataRows.map((row) => textOf2(row, 0))
  const nonEmptyRowKeys = rowKeyCells.filter((v) => v.trim() !== '')
  const blankRowKeyFraction = 1 - nonEmptyRowKeys.length / dataRows.length
  const looksSequentialNumeric = nonEmptyRowKeys.length > 0 && nonEmptyRowKeys.every((v) => /^\d{1,4}$/.test(v.trim()))

  if (blankRowKeyFraction > 0.5 || looksSequentialNumeric) {
    return { kind: 'log', groupLabel, logFields: buildLogFields(body, groupLabel) }
  }

  const distinctRowKeys = new Set(nonEmptyRowKeys.map((v) => v.trim().toLowerCase()))
  const rowKeysAreDistinct = distinctRowKeys.size >= nonEmptyRowKeys.length * 0.8

  if (!rowKeysAreDistinct) return { kind: 'ambiguous' }

  // Row keys are real, distinct identifiers (equipment, KKS, locations) —
  // decide grid vs. reference by how much of the rest of the table is
  // actually blank/fillable.
  let valueCells = 0
  let blankValueCells = 0
  for (const row of dataRows) {
    for (let c = 1; c < width; c++) {
      valueCells += 1
      if (textOf2(row, c).trim() === '') blankValueCells += 1
    }
  }
  const blankFraction = valueCells === 0 ? 1 : blankValueCells / valueCells

  if (blankFraction < 0.15) return { kind: 'skipped-reference' }

  return { kind: 'grid', groupLabel, measurementFields: buildMeasurementFields(body, groupLabel) }
}

function textOf2(row: TableMatrix[number], c: number): string {
  return row[c]?.text ?? ''
}

function buildMeasurementFields(matrix: TableMatrix, groupLabel: string): DetectedMeasurementField[] {
  const width = matrix[0].length
  const dataRows = matrix.slice(1)
  const columns = Array.from({ length: width - 1 }, (_, i) => i + 1).map((c) => {
    const header = textOf(matrix, 0, c) || `Column ${c}`
    const { columnLabel, unit } = splitUnit(header)
    const sample = dataRows.map((row) => textOf2(row, c))
    return { columnLabel, unit, fieldType: guessFieldType(header, sample) }
  })

  const fields: DetectedMeasurementField[] = []
  const seenRowLabels = new Set<string>()
  for (const row of dataRows) {
    const rowLabelRaw = textOf2(row, 0).trim()
    if (!rowLabelRaw) continue
    // De-duplicate row labels that repeat verbatim (defensive — shouldn't
    // normally happen once merge-continuation cells are handled correctly).
    let rowLabel = rowLabelRaw
    if (seenRowLabels.has(rowLabel)) {
      let suffix = 2
      while (seenRowLabels.has(`${rowLabelRaw} (${suffix})`)) suffix += 1
      rowLabel = `${rowLabelRaw} (${suffix})`
    }
    seenRowLabels.add(rowLabel)

    for (const col of columns) {
      fields.push({ groupLabel, rowLabel, columnLabel: col.columnLabel, unit: col.unit, fieldType: col.fieldType })
    }
  }
  return fields
}

function buildLogFields(matrix: TableMatrix, groupLabel: string): DetectedLogField[] {
  const width = matrix[0].length
  const dataRows = matrix.slice(1)
  return Array.from({ length: width }, (_, c) => c).map((c) => {
    const header = textOf(matrix, 0, c) || `Column ${c + 1}`
    const { columnLabel, unit } = splitUnit(header)
    const sample = dataRows.map((row) => textOf2(row, c))
    return { groupLabel, columnLabel, unit, fieldType: guessFieldType(header, sample) }
  })
}
