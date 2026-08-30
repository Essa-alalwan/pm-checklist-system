import type { NumericOrNA } from '../types/checklist'

export type { NumericOrNA }

const NA_PATTERN = /^n\/?a$/i

export function parseNumericOrNA(raw: string): NumericOrNA | undefined {
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  if (NA_PATTERN.test(trimmed)) return 'N/A'
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : undefined
}

export function formatNumericOrNA(value: NumericOrNA | undefined): string {
  if (value === undefined) return ''
  return String(value)
}
