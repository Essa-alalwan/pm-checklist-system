import { clsx } from 'clsx'
import { AlertTriangle, Check, Minus } from 'lucide-react'
import type { ChecklistItemResult, ChecklistItemStatus } from '../../types/checklist'

const ICONS: Record<ChecklistItemStatus, typeof Check> = { done: Check, na: Minus, flagged: AlertTriangle }
const CLASSES: Record<ChecklistItemStatus, string> = {
  done: 'bg-done-dim text-done border-done/40',
  na: 'bg-na-dim text-na border-na/40',
  flagged: 'bg-flagged-dim text-flagged border-flagged/40',
}

export function ChecklistItemsReadOnly({ items }: { items: ChecklistItemResult[] }) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item, index) => {
        const Icon = ICONS[item.status]
        return (
          <li key={item.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-3 font-mono text-xs font-semibold text-text-faint">
                {index + 1}
              </span>
              <p className="flex-1 text-sm text-text">{item.label}</p>
              <span
                className={clsx(
                  'flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold capitalize',
                  CLASSES[item.status],
                )}
              >
                <Icon className="size-3" aria-hidden="true" />
                {item.status}
              </span>
            </div>
            {item.note && <p className="ml-9 text-sm text-text-muted">{item.note}</p>}
          </li>
        )
      })}
    </ul>
  )
}
