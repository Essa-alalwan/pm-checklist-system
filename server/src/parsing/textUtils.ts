// Small text-cleanup/classification helpers shared between the list-based
// item extraction, the table-based item/field extraction, and their tests.

// The paper forms end each item with a fill-in-the-blank status placeholder,
// e.g. "(                    )" or "( N/A )" once filled in — strip it if present.
// Real documents pad it with long runs of spaces/tabs, hence the \s* either side.
const TRAILING_PLACEHOLDER = /\(\s*(?:done|n\/?a|flagged|yes|no)?\s*\)\s*$/i

export function cleanItemText(raw: string): string {
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  return collapsed.replace(TRAILING_PLACEHOLDER, '').trim()
}

// Guards against stray fragments (table cells, bookmark anchors, empty
// placeholder-only paragraphs) — a real checklist item is a sentence, not
// mostly digits/punctuation/whitespace.
export function isRealSentence(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '')
  return letters.length >= 8
}

// A table cell that's either fully empty or just a checkbox-style
// placeholder/short yes-no marker — the "did you do this" side of an items
// table row, as opposed to the cell holding the item's actual description.
const PLACEHOLDER_CELL = /^\s*(?:\(\s*\)|done|n\/?a|flagged|yes\s*\/\s*no|y\s*\/\s*n|yes|no)?\s*$/i

export function isPlaceholderCell(text: string): boolean {
  return PLACEHOLDER_CELL.test(text)
}
