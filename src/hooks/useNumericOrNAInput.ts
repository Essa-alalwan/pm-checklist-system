import { useState, type ChangeEvent } from 'react'
import { formatNumericOrNA, parseNumericOrNA, type NumericOrNA } from '../lib/numericOrNA'

/**
 * Backs a text input that accepts either a number or the literal "N/A".
 * The input's displayed text is local state, not derived from the parsed
 * value on every render — otherwise an in-progress keystroke (e.g. a lone
 * "-" while typing "-0.03") would parse to `undefined` and get wiped from
 * the box before the user finishes typing.
 */
export function useNumericOrNAInput(value: NumericOrNA | undefined, onChange: (value: NumericOrNA | undefined) => void) {
  const [raw, setRaw] = useState(() => formatNumericOrNA(value))

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value)
    onChange(parseNumericOrNA(e.target.value))
  }

  return { raw, handleChange }
}
