import * as cheerio from 'cheerio'
import mammoth from 'mammoth'
import { classifyTable } from './classifyTable'
import { tableToMatrix, type TableMatrix } from './tableExtraction'
import { cleanItemText, isRealSentence } from './textUtils'
import type { DetectedItem, DetectedTableGroup, ParsedChecklist } from './parsedChecklistTypes'

export type { ParsedChecklist } from './parsedChecklistTypes'

// Matches "1. Clean the low voltage motor." / "12) Check the ..." — a leading
// number, a period or paren, then real sentence text.
const NUMBERED_LINE = /^\s*(\d{1,3})[.)]\s+(.{8,})$/

/**
 * Fallback strategy: documents where the numbers really are typed as literal
 * text (no Word list formatting, and no items-shaped table either).
 */
function extractItemsFromNumberedText(rawText: string): DetectedItem[] {
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const items: DetectedItem[] = []
  for (const line of lines) {
    const match = line.match(NUMBERED_LINE)
    if (!match) continue
    const text = cleanItemText(match[2])
    if (isRealSentence(text)) items.push({ text, source: 'list' })
  }
  return items
}

function previewRows(matrix: TableMatrix, maxRows = 4): string[][] {
  return matrix.slice(0, maxRows).map((row) => row.map((cell) => cell.text))
}

/**
 * Walks the document body in source order, so list-items and tables come
 * out interleaved the same way they read in the original document (rather
 * than two independent passes with no ordering guarantee between them).
 * <ol>/<ul> elements contribute items directly; <table> elements are
 * expanded into a real row/column matrix (respecting rowspan/colspan) and
 * classified as an items table, a fixed measurement grid, an open-ended
 * log register, or skipped (job-info header / fully-populated reference
 * table / not confidently classifiable).
 */
function walkBody(html: string): { items: DetectedItem[]; tableGroups: DetectedTableGroup[] } {
  const $ = cheerio.load(html)
  const items: DetectedItem[] = []
  const tableGroups: DetectedTableGroup[] = []
  let tableIndex = 0

  $('body')
    .children()
    .each((_, el) => {
      const tag = el.tagName?.toLowerCase()

      if (tag === 'ol' || tag === 'ul') {
        $(el)
          .find('li')
          .each((__, li) => {
            const text = cleanItemText($(li).text())
            if (isRealSentence(text)) items.push({ text, source: 'list' })
          })
        return
      }

      if (tag === 'table') {
        const index = tableIndex
        tableIndex += 1
        const matrix = tableToMatrix($(el), $)
        const classification = classifyTable(matrix, index)

        if (classification.kind === 'items') {
          for (const text of classification.items) items.push({ text, source: 'table', sourceTableIndex: index })
          return
        }

        const base = { sourceTableIndex: index, previewRows: previewRows(matrix) }
        if (classification.kind === 'grid') {
          tableGroups.push({ ...base, classification: 'grid', groupLabel: classification.groupLabel, measurementFields: classification.measurementFields })
        } else if (classification.kind === 'log') {
          tableGroups.push({ ...base, classification: 'log', groupLabel: classification.groupLabel, logFields: classification.logFields })
        } else {
          tableGroups.push({ ...base, classification: classification.kind, groupLabel: `Table ${index + 1}` })
        }
      }
    })

  return { items, tableGroups }
}

function guessTitleFromFilename(originalFilename?: string): string | undefined {
  if (!originalFilename) return undefined
  let name = originalFilename.replace(/\.docx$/i, '')
  name = name.replace(/\s*-\s*copy\s*$/i, '')
  name = name.replace(/[-_\s]*rev(?:ision)?\s*\d+\s*$/i, '')
  name = name.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return name.length > 3 ? name : undefined
}

function guessTitleFromBody(preambleLines: string[]): string {
  const candidates = preambleLines.filter((l) => !/^(kks|description|page|comments?)\b/i.test(l))
  const pool = candidates.length > 0 ? candidates : preambleLines
  const longest = [...pool].sort((a, b) => b.length - a.length)[0]
  return (longest ?? 'New Checklist').slice(0, 80)
}

export async function parseChecklistDocx(buffer: Buffer, originalFilename?: string): Promise<ParsedChecklist> {
  const { value: html } = await mammoth.convertToHtml({ buffer })
  let { items, tableGroups } = walkBody(html)

  if (items.length === 0) {
    const { value: rawText } = await mammoth.extractRawText({ buffer })
    items = extractItemsFromNumberedText(rawText)
  }

  const { value: rawText } = await mammoth.extractRawText({ buffer })
  const preambleLines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    // Exclude lines that are actually a checklist item's raw text — a short
    // preamble slice ("first few lines") can otherwise swallow item 1 when
    // the document's header block is only one or two lines long. Matched by
    // prefix, not equality — the raw line can carry extra trailing junk
    // (e.g. a placeholder's stray unmatched "(") that the item text doesn't.
    .filter((line) => !items.some((item) => cleanItemText(line).startsWith(item.text)))
    .slice(0, 5)

  const suggestedLabel = guessTitleFromFilename(originalFilename) ?? guessTitleFromBody(preambleLines)
  const suggestedDescription = preambleLines
    .filter((line) => line !== suggestedLabel && !/^(kks|page|comments?)\b/i.test(line))
    .join(' ')
    // Header lines are mostly unfilled "Label:  (        )" blanks — the
    // label text is useful context, the empty placeholder parens aren't.
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 200)

  return { suggestedLabel, suggestedDescription, items, tableGroups }
}
