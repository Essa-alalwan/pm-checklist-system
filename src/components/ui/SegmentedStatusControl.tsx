import { clsx } from 'clsx'
import { AlertTriangle, Check, Minus } from 'lucide-react'
import type { ChecklistItemStatus } from '../../types/checklist'

interface SegmentedStatusControlProps {
  value: ChecklistItemStatus
  onChange: (status: ChecklistItemStatus) => void
  ariaLabel: string
}

const OPTIONS: { value: 'done' | 'na' | 'flagged'; label: string; icon: typeof Check }[] = [
  { value: 'done', label: 'Done', icon: Check },
  { value: 'na', label: 'N/A', icon: Minus },
  { value: 'flagged', label: 'Flagged', icon: AlertTriangle },
]

const ACTIVE_CLASSES: Record<'done' | 'na' | 'flagged', string> = {
  done: 'bg-done-dim text-done border-done/50 shadow-[0_0_0_1px_var(--color-done)_inset]',
  na: 'bg-na-dim text-na border-na/50 shadow-[0_0_0_1px_var(--color-na)_inset]',
  flagged: 'bg-flagged-dim text-flagged border-flagged/50 shadow-[0_0_0_1px_var(--color-flagged)_inset]',
}

export function SegmentedStatusControl({ value, onChange, ariaLabel }: SegmentedStatusControlProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid grid-cols-3 gap-2">
      {OPTIONS.map(({ value: optValue, label, icon: Icon }) => {
        const active = value === optValue
        return (
          <button
            key={optValue}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(optValue)}
            className={clsx(
              'flex min-h-12 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors',
              active ? ACTIVE_CLASSES[optValue] : 'border-border-strong bg-surface-2 text-text-muted hover:text-text',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
