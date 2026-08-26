import { clsx } from 'clsx'
import type { ReactNode } from 'react'

interface FieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, required, error, hint, children, className }: FieldProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-muted">
        {label}
        {required && (
          <span className="text-flagged ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-faint">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputClasses =
  'min-h-11 w-full rounded-lg border border-border-strong bg-surface-2 px-3 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30 disabled:opacity-50'

export function inputClassesWithError(hasError?: boolean) {
  return clsx(inputClasses, hasError && 'border-critical focus-visible:border-critical focus-visible:ring-critical/30')
}
