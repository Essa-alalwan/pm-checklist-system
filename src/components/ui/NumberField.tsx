import { useId } from 'react'
import { clsx } from 'clsx'
import { inputClasses } from './Field'
import { useNumericOrNAInput } from '../../hooks/useNumericOrNAInput'
import type { NumericOrNA } from '../../lib/numericOrNA'

interface NumberFieldProps {
  label: string
  value: NumericOrNA | undefined
  onChange: (value: NumericOrNA | undefined) => void
  unit?: string
  className?: string
}

export function NumberField({ label, value, onChange, unit, className }: NumberFieldProps) {
  const id = useId()
  const { raw, handleChange } = useNumericOrNAInput(value, onChange)

  return (
    <label htmlFor={id} className={clsx('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className={clsx(inputClasses, 'font-mono tabular-nums', unit && 'pr-12')}
          value={raw}
          onChange={handleChange}
          placeholder="0 or N/A"
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-faint">{unit}</span>
        )}
      </div>
    </label>
  )
}
