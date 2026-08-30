import { clsx } from 'clsx'
import { inputClasses } from './Field'
import { useNumericOrNAInput } from '../../hooks/useNumericOrNAInput'
import type { NumericOrNA } from '../../lib/numericOrNA'

interface NumericOrNACellInputProps {
  value: NumericOrNA | undefined
  onChange: (value: NumericOrNA | undefined) => void
  ariaLabel: string
  className?: string
}

export function NumericOrNACellInput({ value, onChange, ariaLabel, className }: NumericOrNACellInputProps) {
  const { raw, handleChange } = useNumericOrNAInput(value, onChange)

  return (
    <input
      type="text"
      inputMode="decimal"
      className={clsx(inputClasses, 'min-h-10 font-mono tabular-nums', className)}
      value={raw}
      onChange={handleChange}
      placeholder="N/A"
      aria-label={ariaLabel}
    />
  )
}
