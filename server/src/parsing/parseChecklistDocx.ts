import * as cheerio from 'cheerio'
import mammoth from 'mammoth'

export interface ParsedChecklist {
  suggestedLabel: string
  suggestedDescription: string
  items: string[]
}

// The paper forms end each item with a fill-in-the-blank status placeholder,
// e.g. "(                    )" or "( N/A )" once filled in — strip it if present.
// Real documents pad it with long runs of spaces/tabs, hence the \s* either side.
const TRAILING_PLACEHOLDER = /\(\s*(?:done|n\/?a|flagged|yes|no)?\s*\)\s*$/i

function cleanItemText(raw: string): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  return collapsed.replace(TRAILING_PLACEHOLDER, '').trim()
}

function isRealSentence(text: string): boolean {
  // Guards against stray fragments (table cells, bookmark anchors, empty
  // placeholder-only paragraphs) — a real checklist item is a sentence, not
  // mostly digits/punctuation/whitespace.
  const letters = text.replace(/[^a-zA-Z]/g, '')
  return letters.length >= 8
}

/**
 * Primary strategy: most real-world checklists use Word's built-in numbered-
 * list button, not literal "1." text — the number is formatting metadata,
 * invisible to plain text extraction. Converting to HTML makes mammoth
 * resolve that numbering into real <ol><li> elements we can read directly,
 * regardless of how many separate <ol> blocks the document ends up split
 * into (Word quirks can break a single visual list into several).
 */
async function extractItemsFromLists(buffer: Buffer): Promise<string[]> {
  const { value: html } = await mammoth.convertToHtml({ buffer })
  const $ = cheerio.load(html)

  const items: string[] = []
  $('li').each((_, el) => {
    const text = cleanItemText($(el).text())
    if (isRealSentence(text)) items.push(text)
  })
  return items
}

// Matches "1. Clean the low voltage motor." / "12) Check the ..." — a leading
// number, a period or paren, then real sentence text.
const NUMBERED_LINE = /^\s*(\d{1,3})[.)]\s+(.{8,})$/

/**
 * Fallback strategy: documents where the numbers really are typed as literal
 * text (no Word list formatting at all).
 */
async function extractItemsFromNumberedText(buffer: Buffer): Promise<string[]> {
  const { value: rawText } = await mammoth.extractRawText({ buffer })
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const items: string[] = []
  for (const line of lines) {
    const match = line.match(NUMBERED_LINE)
    if (!match) continue
    const text = cleanItemText(match[2])
    if (isRealSentence(text)) items.push(text)
  }
  return items
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
  let items = await extractItemsFromLists(buffer)
  if (items.length === 0) {
    items = await extractItemsFromNumberedText(buffer)
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
    .filter((line) => !items.some((item) => cleanItemText(line).startsWith(item)))
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

  return { suggestedLabel, suggestedDescription, items }
}
