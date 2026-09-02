import { describe, expect, it } from 'vitest'
import { parseChecklistDocx } from '../parseChecklistDocx'
import {
  buildItemsInTableDocx,
  buildLogTableDocx,
  buildMeasurementGridDocx,
  buildNumberedListDocx,
  buildReferenceTableDocx,
} from './fixtures'

describe('parseChecklistDocx', () => {
  it('extracts items from a real Word numbered list', async () => {
    const buffer = await buildNumberedListDocx()
    const result = await parseChecklistDocx(buffer)
    expect(result.items.map((i) => i.text)).toEqual([
      'Clean the equipment enclosure',
      'Check terminal tightness and tighten if required',
      'Measure and record insulation resistance',
    ])
    expect(result.items.every((i) => i.source === 'list')).toBe(true)
    expect(result.tableGroups).toEqual([])
  })

  it('extracts items sitting inside a table row (the case the old parser dropped)', async () => {
    const buffer = await buildItemsInTableDocx()
    const result = await parseChecklistDocx(buffer)
    expect(result.items.map((i) => i.text)).toEqual([
      'MV breaker in rack out position',
      'Is primary earthing switch applied',
      'Is shutter & earthing locked',
    ])
    expect(result.items.every((i) => i.source === 'table')).toBe(true)
    // Consumed entirely as items — nothing left over as a table suggestion.
    expect(result.tableGroups).toEqual([])
  })

  it('classifies a fixed measurement grid and expands its rowspan correctly', async () => {
    const buffer = await buildMeasurementGridDocx()
    const result = await parseChecklistDocx(buffer)
    expect(result.tableGroups).toHaveLength(1)
    const group = result.tableGroups[0]
    expect(group.classification).toBe('grid')
    expect(group.measurementFields).toBeDefined()
    // 3 distinct KKS rows x 3 value columns (Cooling Group, OTI, WTI - HV).
    const rowLabels = new Set(group.measurementFields!.map((f) => f.rowLabel))
    expect(rowLabels).toEqual(new Set(['11BAT01', '11BBT01', '12BAT01']))
    // The rowspan-2 "Group A" cell should apply to both 11BAT01 and 11BBT01.
    const coolingGroupFields = group.measurementFields!.filter((f) => f.columnLabel === 'Cooling Group')
    expect(coolingGroupFields).toHaveLength(3)
    const otiField = group.measurementFields!.find((f) => f.columnLabel === 'OTI')
    expect(otiField).toMatchObject({ unit: '°C', fieldType: 'number' })
  })

  it('classifies a header-only table as an open-ended log', async () => {
    const buffer = await buildLogTableDocx()
    const result = await parseChecklistDocx(buffer)
    expect(result.tableGroups).toHaveLength(1)
    expect(result.tableGroups[0].classification).toBe('log')
    expect(result.tableGroups[0].logFields?.map((f) => f.columnLabel)).toEqual(['S.NO', 'KKS', 'Peak Cable PD', 'Observation'])
  })

  it('skips a fully-populated reference table rather than modeling it as a field', async () => {
    const buffer = await buildReferenceTableDocx()
    const result = await parseChecklistDocx(buffer)
    expect(result.tableGroups).toHaveLength(1)
    expect(result.tableGroups[0].classification).toBe('skipped-reference')
    expect(result.tableGroups[0].measurementFields).toBeUndefined()
    expect(result.tableGroups[0].logFields).toBeUndefined()
  })
})
