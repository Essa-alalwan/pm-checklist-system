import { useId } from 'react'
import { clsx } from 'clsx'
import type { ChecklistItemResult, ChecklistItemStatus } from '../../types/checklist'
import { SegmentedStatusControl } from '../ui/SegmentedStatusControl'
import { inputClasses } from '../ui/Field'

interface ChecklistItemRowProps {
  index: number
  item: ChecklistItemResult
  onChange: (next: ChecklistItemResult) => void
}

export function ChecklistItemRow({ index, item, onChange }: ChecklistItemRowProps) {
  const noteId = useId()

  const setStatus = (status: ChecklistItemStatus) => {
    onChange({ ...item, status, note: status === 'flagged' ? item.note : undefined })
  }

  return (
    <div
      id={`checklist-item-${item.id}`}
      className={clsx(
        'scroll-mt-6 rounded-xl border p-4 transition-colors',
        item.status === 'flagged'
          ? 'border-flagged/50 bg-flagged-dim/40'
          : item.status === 'pending'
            ? 'border-dashed border-border-strong bg-surface'
            : 'border-border bg-surface',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-3 font-mono text-xs font-semibold text-text-faint">
          {index + 1}
        </span>
        <p className="flex-1 text-sm font-medium text-text">{item.label}</p>
        {item.status === 'pending' && (
          <span className="shrink-0 text-xs font-medium text-text-faint">Needs a status</span>
        )}
      </div>

      <div className="mt-3 sm:pl-9">
        <SegmentedStatusControl value={item.status} onChange={setStatus} ariaLabel={`Status for: ${item.label}`} />
      </div>

      {item.status === 'flagged' && (
        <div className="mt-3 sm:pl-9">
          <label htmlFor={noteId} className="mb-1.5 block text-xs font-medium text-flagged">
            Describe the issue
          </label>
          <textarea
            id={noteId}
            rows={2}
            required
            className={clsx(inputClasses, 'min-h-20 resize-y py-2')}
            placeholder="What was found, and any action taken..."
            value={item.note ?? ''}
            onChange={(e) => onChange({ ...item, note: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
