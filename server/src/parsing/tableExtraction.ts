import type { Cheerio, CheerioAPI } from 'cheerio'

// A normalized cell in a table's geometry. `text` is always populated —
// for a cell that's covered by a rowspan/colspan from another cell,
// `isMergeContinuation` is true and `text` is copied from that origin cell,
// so a merged label reads as "repeated" per row/column the way a human
// reading the table would perceive it.
export interface TableCell {
  text: string
  rowSpan: number
  colSpan: number
  isMergeContinuation: boolean
}

// TableMatrix[rowIndex][colIndex] — always fully rectangular (every row has
// the same length, padded if the source table's rows were ragged).
export type TableMatrix = TableCell[][]

function collapseWhitespace(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

interface CarriedCell {
  text: string
  rowsRemaining: number
}

/**
 * Expands a cheerio <table> into a rectangular matrix, correctly placing
 * cells that carry rowspan/colspan (mammoth already resolves Word's merged
 * cells into real HTML rowspan/colspan attributes, so this only has to do
 * ordinary HTML-table geometry, not any OOXML-level merge parsing).
 *
 * Standard occupancy-tracking algorithm: `carryIn` holds, for the row about
 * to be built, which columns are pre-occupied by a still-active rowspan from
 * an earlier row. At each column we either place a carried continuation
 * cell (and register it again in `carryOut` if it still has rows left to
 * span), or consume the next real <td>/<th>, placing colSpan-many cells and
 * registering any rowSpan > 1 into `carryOut` for future rows.
 */
export function tableToMatrix($table: Cheerio<any>, $: CheerioAPI): TableMatrix { // eslint-disable-line @typescript-eslint/no-explicit-any -- cheerio doesn't publicly export its node element type
  const rows: TableCell[][] = []
  let carryIn = new Map<number, CarriedCell>()

  $table.find('tr').each((_, tr) => {
    const row: TableCell[] = []
    const carryOut = new Map<number, CarriedCell>()
    const tds = $(tr).find('> td, > th').toArray()
    const maxCarryInCol = carryIn.size > 0 ? Math.max(...carryIn.keys()) : -1

    let tdIndex = 0
    let col = 0

    while (tdIndex < tds.length || col <= maxCarryInCol) {
      const carried = carryIn.get(col)
      if (carried) {
        row[col] = { text: carried.text, rowSpan: 1, colSpan: 1, isMergeContinuation: true }
        if (carried.rowsRemaining > 1) carryOut.set(col, { text: carried.text, rowsRemaining: carried.rowsRemaining - 1 })
        col += 1
        continue
      }

      if (tdIndex >= tds.length) {
        // No more real cells in this row but we haven't reached the last
        // carried-in column yet, and this particular column has no carry
        // either (a ragged row) — pad with an empty continuation cell.
        row[col] = { text: '', rowSpan: 1, colSpan: 1, isMergeContinuation: true }
        col += 1
        continue
      }

      const td = tds[tdIndex]
      tdIndex += 1
      const $td = $(td)
      const rowSpan = Math.max(1, parseInt($td.attr('rowspan') ?? '1', 10) || 1)
      const colSpan = Math.max(1, parseInt($td.attr('colspan') ?? '1', 10) || 1)
      const text = collapseWhitespace($td.text())

      for (let i = 0; i < colSpan; i++) {
        row[col + i] = { text, rowSpan: i === 0 ? rowSpan : 1, colSpan: i === 0 ? colSpan : 1, isMergeContinuation: i !== 0 }
        if (rowSpan > 1) carryOut.set(col + i, { text, rowsRemaining: rowSpan - 1 })
      }
      col += colSpan
    }

    rows.push(row)
    carryIn = carryOut
  })

  const width = rows.reduce((max, r) => Math.max(max, r.length), 0)
  for (const row of rows) {
    while (row.length < width) row.push({ text: '', rowSpan: 1, colSpan: 1, isMergeContinuation: true })
  }

  return rows
}
