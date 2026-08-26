import { useId } from 'react'
import { clsx } from 'clsx'
import { inputClasses } from './Field'

interface NumberFieldProps {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  unit?: string
  step?: number
  className?: string
}

export function NumberField({ label, value, onChange, unit, step = 0.01, className }: NumberFieldProps) {
  const id = useId()
  return (
    <label htmlFor={id} className={clsx('flex flex-col gap-1.5', className)}>
      <span className="text-xs font-medium text-text-muted">{label}</span>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          className={clsx(inputClasses, 'font-mono tabular-nums', unit && 'pr-12')}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-faint">{unit}</span>
        )}
      </div>
    </label>
  )
}
