import { AlertTriangle } from 'lucide-react'
import type { ChecklistItemResult } from '../../types/checklist'

export function FlaggedCallout({ items }: { items: ChecklistItemResult[] }) {
  const flagged = items.filter((i) => i.status === 'flagged')
  if (flagged.length === 0) return null

  return (
    <div className="rounded-xl border border-flagged/50 bg-flagged-dim p-4">
      <div className="flex items-center gap-2 text-flagged">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        <h2 className="text-sm font-semibold">
          {flagged.length} item{flagged.length === 1 ? '' : 's'} flagged
        </h2>
      </div>
      <ul className="mt-3 flex flex-col gap-2.5">
        {flagged.map((item) => (
          <li key={item.id} className="text-sm">
            <p className="font-medium text-text">{item.label}</p>
            {item.note && <p className="mt-0.5 text-text-muted">{item.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
