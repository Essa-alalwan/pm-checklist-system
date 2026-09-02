import { describe, expect, it } from 'vitest'
import * as cheerio from 'cheerio'
import { tableToMatrix } from '../tableExtraction'

function matrixFromHtml(html: string) {
  const $ = cheerio.load(html)
  return tableToMatrix($('table'), $)
}

function texts(matrix: ReturnType<typeof matrixFromHtml>) {
  return matrix.map((row) => row.map((cell) => cell.text))
}

describe('tableToMatrix', () => {
  it('handles a plain grid with no merges', () => {
    const matrix = matrixFromHtml(`
      <table>
        <tr><td>A1</td><td>B1</td></tr>
        <tr><td>A2</td><td>B2</td></tr>
      </table>
    `)
    expect(texts(matrix)).toEqual([
      ['A1', 'B1'],
      ['A2', 'B2'],
    ])
    expect(matrix[0][0].isMergeContinuation).toBe(false)
  })

  it('expands a rowspan-2 cell into the row below', () => {
    const matrix = matrixFromHtml(`
      <table>
        <tr><td rowspan="2">Group</td><td>B1</td></tr>
        <tr><td>B2</td></tr>
      </table>
    `)
    expect(texts(matrix)).toEqual([
      ['Group', 'B1'],
      ['Group', 'B2'],
    ])
    expect(matrix[0][0].rowSpan).toBe(2)
    expect(matrix[0][0].isMergeContinuation).toBe(false)
    expect(matrix[1][0].isMergeContinuation).toBe(true)
  })

  it('expands a colspan-2 cell across a row', () => {
    const matrix = matrixFromHtml(`
      <table>
        <tr><td colspan="2">Header</td></tr>
        <tr><td>A2</td><td>B2</td></tr>
      </table>
    `)
    expect(texts(matrix)).toEqual([
      ['Header', 'Header'],
      ['A2', 'B2'],
    ])
    expect(matrix[0][0].colSpan).toBe(2)
    expect(matrix[0][0].isMergeContinuation).toBe(false)
    expect(matrix[0][1].isMergeContinuation).toBe(true)
  })

  it('handles a combined rowspan+colspan (L-shaped) merge alongside ordinary cells', () => {
    // Row 0: [Group(rowspan2,colspan2)] [C1]
    // Row 1: [Group continues.......  ] [C2]
    // Row 2: [D3                 ] [E3] [F3]
    const matrix = matrixFromHtml(`
      <table>
        <tr><td rowspan="2" colspan="2">Group</td><td>C1</td></tr>
        <tr><td>C2</td></tr>
        <tr><td>D3</td><td>E3</td><td>F3</td></tr>
      </table>
    `)
    expect(texts(matrix)).toEqual([
      ['Group', 'Group', 'C1'],
      ['Group', 'Group', 'C2'],
      ['D3', 'E3', 'F3'],
    ])
    expect(matrix[0][0].isMergeContinuation).toBe(false)
    expect(matrix[0][1].isMergeContinuation).toBe(true)
    expect(matrix[1][0].isMergeContinuation).toBe(true)
    expect(matrix[1][1].isMergeContinuation).toBe(true)
  })

  it('pads ragged rows to a rectangular matrix', () => {
    const matrix = matrixFromHtml(`
      <table>
        <tr><td>A1</td><td>B1</td><td>C1</td></tr>
        <tr><td>A2</td></tr>
      </table>
    `)
    expect(matrix[0]).toHaveLength(3)
    expect(matrix[1]).toHaveLength(3)
    expect(matrix[1][1].text).toBe('')
    expect(matrix[1][1].isMergeContinuation).toBe(true)
  })

  it('collapses internal whitespace in cell text', () => {
    const matrix = matrixFromHtml(`
      <table>
        <tr><td>  Hello   \n  World  </td></tr>
      </table>
    `)
    expect(matrix[0][0].text).toBe('Hello World')
  })

  it('reproduces the real "Weekly Checks of Transformers (PWR)" pattern: a two-row rowspan header spanning several columns', () => {
    // Mirrors the GSUT/UAT insulation-resistance-style table shape used
    // throughout this project's source documents: a row-label column with a
    // rowspan-2 group cell, plus ordinary per-column data cells beneath it.
    const matrix = matrixFromHtml(`
      <table>
        <tr><td rowspan="2">LV1 Winding Temperature</td><td>NA</td></tr>
        <tr><td>NA</td></tr>
      </table>
    `)
    expect(texts(matrix)).toEqual([
      ['LV1 Winding Temperature', 'NA'],
      ['LV1 Winding Temperature', 'NA'],
    ])
  })
})
