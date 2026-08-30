import mammoth from 'mammoth'

export interface ParsedChecklist {
  suggestedLabel: string
  suggestedDescription: string
  items: string[]
}

// Matches "1. Clean the low voltage motor." / "12) Check the ..." — a leading
// number, a period or paren, then real sentence text. The min-length on the
// text group is what keeps this from matching decimal numbers in table cells
// (e.g. "58.9" has no space after the '.', so it never matches at all).
const NUMBERED_LINE = /^\s*(\d{1,3})[.)]\s+(.{8,})$/

// The paper forms end each item with a fill-in-the-blank status placeholder,
// e.g. "(    )" or "( N/A )" once filled in — strip it if present.
const TRAILING_PLACEHOLDER = /\(\s*(?:done|n\/?a|flagged|yes|no)?\s*\)\s*$/i

function isRealSentence(text: string): boolean {
  // Guards against stray table-cell fragments ("58.9", "1st Set", "R-Y") that
  // could otherwise slip past the line regex — a real checklist item is a
  // sentence, not mostly digits/punctuation.
  const letters = text.replace(/[^a-zA-Z]/g, '')
  return letters.length >= 8
}

function guessTitle(preambleLines: string[]): string {
  const candidates = preambleLines.filter((l) => !/^(kks|description|page|comments?)\b/i.test(l))
  const pool = candidates.length > 0 ? candidates : preambleLines
  const longest = [...pool].sort((a, b) => b.length - a.length)[0]
  return (longest ?? 'New Checklist').slice(0, 80)
}

export async function parseChecklistDocx(buffer: Buffer): Promise<ParsedChecklist> {
  const { value: rawText } = await mammoth.extractRawText({ buffer })
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  const items: string[] = []
  let firstItemIndex = -1

  lines.forEach((line, index) => {
    const match = line.match(NUMBERED_LINE)
    if (!match) return

    const text = match[2].trim().replace(TRAILING_PLACEHOLDER, '').trim()
    if (!isRealSentence(text)) return

    items.push(text)
    if (firstItemIndex === -1) firstItemIndex = index
  })

  const preambleLines = firstItemIndex > 0 ? lines.slice(0, firstItemIndex) : []
  const suggestedLabel = guessTitle(preambleLines)
  const suggestedDescription = preambleLines
    .filter((line) => line !== suggestedLabel && !/^(kks|page|comments?)\b/i.test(line))
    .join(' ')
    .slice(0, 200)

  return { suggestedLabel, suggestedDescription, items }
}
