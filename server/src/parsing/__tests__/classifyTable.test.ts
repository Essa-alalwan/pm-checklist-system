import { describe, expect, it } from 'vitest'
import { classifyTable } from '../classifyTable'
import type { TableCell, TableMatrix } from '../tableExtraction'

function matrix(rows: string[][]): TableMatrix {
  return rows.map((row) => row.map((text): TableCell => ({ text, rowSpan: 1, colSpan: 1, isMergeContinuation: false })))
}

describe('classifyTable', () => {
  it('classifies a small KKS/Date job-info block as skipped-header', () => {
    const m = matrix([
      ['KKS:', ''],
      ['Date:', ''],
      ['Prepared By:', 'Done By:'],
    ])
    expect(classifyTable(m, 0)).toEqual({ kind: 'skipped-header' })
  })

  it('extracts items from a Sl.No/Description/checkbox table', () => {
    const m = matrix([
      ['Sl.No', 'Description of Checks', 'Remarks'],
      ['1', 'MV Breaker in rack out position', '(   )'],
      ['2', 'Is primary earthing switch applied', '(   )'],
      ['3', 'Is shutter & earthing locked', '(   )'],
    ])
    const result = classifyTable(m, 0)
    expect(result.kind).toBe('items')
    if (result.kind === 'items') {
      expect(result.items).toEqual([
        'MV Breaker in rack out position',
        'Is primary earthing switch applied',
        'Is shutter & earthing locked',
      ])
    }
  })

  it('classifies a table of named equipment rows with blank readings as a grid', () => {
    const m = matrix([
      ['KKS', 'Transformer', 'OTI (°C)', 'WTI - HV (°C)'],
      ['11BAT01', 'GT11 GSUT', '', ''],
      ['11BBT01', 'GT11 UAT', '', ''],
      ['12BAT01', 'GT12 GSUT', '', ''],
    ])
    const result = classifyTable(m, 0)
    expect(result.kind).toBe('grid')
    if (result.kind === 'grid') {
      // 3 data rows x 2 value columns (Transformer name col + 2 reading cols after KKS-as-row-key... )
      expect(result.measurementFields.length).toBe(3 * 3)
      expect(result.measurementFields[0]).toMatchObject({ rowLabel: '11BAT01', columnLabel: 'Transformer', fieldType: 'text' })
      const otiField = result.measurementFields.find((f) => f.columnLabel === 'OTI')
      expect(otiField).toMatchObject({ unit: '°C', fieldType: 'number' })
    }
  })

  it('classifies a header-only table (no data rows) as a log', () => {
    const m = matrix([['S.NO', 'KKS', 'MV AC Motor', 'Motor Current (A)']])
    const result = classifyTable(m, 0)
    expect(result.kind).toBe('log')
    if (result.kind === 'log') {
      expect(result.logFields.map((f) => f.columnLabel)).toEqual(['S.NO', 'KKS', 'MV AC Motor', 'Motor Current'])
      expect(result.logFields.find((f) => f.columnLabel === 'Motor Current')?.fieldType).toBe('number')
    }
  })

  it('classifies a table whose row-key column is blank across every row as a log', () => {
    const m = matrix([
      ['Location', 'Earth Pit Identification', 'Resistance (Ω)'],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ])
    const result = classifyTable(m, 0)
    expect(result.kind).toBe('log')
  })

  it('classifies a table whose row-key column is just sequential numbers as a log', () => {
    const m = matrix([
      ['Cell No.', 'Volts', 'Temp'],
      ['1', '', ''],
      ['2', '', ''],
      ['3', '', ''],
    ])
    const result = classifyTable(m, 0)
    expect(result.kind).toBe('log')
  })

  it('classifies a fully-populated reference/legend table as skipped-reference', () => {
    const m = matrix([
      ['Severity', 'Peak PD (pC)', 'Action'],
      ['Normal', '< 100', 'No action required'],
      ['Warning', '100 - 500', 'Monitor closely'],
      ['Critical', '> 500', 'Immediate investigation'],
    ])
    const result = classifyTable(m, 0)
    expect(result.kind).toBe('skipped-reference')
  })

  it('treats "NA" cells as ordinary fillable content, not a special case', () => {
    const m = matrix([
      ['KKS', 'WTI LV1 (°C)', 'WTI LV2 (°C)'],
      ['11BAT01', 'NA', 'NA'],
      ['11BBT01', '', ''],
      ['12BAT01', 'NA', 'NA'],
    ])
    const result = classifyTable(m, 0)
    // Still a grid — NA is just a cell value like any other, not a signal to
    // omit the field or reclassify the table.
    expect(result.kind).toBe('grid')
    if (result.kind === 'grid') {
      expect(result.measurementFields.some((f) => f.rowLabel === '11BAT01' && f.columnLabel === 'WTI LV1')).toBe(true)
    }
  })

  it('falls back to ambiguous when row keys are present but mostly repeated', () => {
    const m = matrix([
      ['Group', 'Reading'],
      ['A', ''],
      ['A', ''],
      ['A', ''],
      ['B', ''],
    ])
    const result = classifyTable(m, 0)
    expect(result.kind).toBe('ambiguous')
  })
})
