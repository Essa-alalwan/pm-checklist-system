import { Link } from 'react-router-dom'
import { ChevronRight, Zap, CircleGauge } from 'lucide-react'
import type { ChecklistRecord } from '../../types/checklist'
import { hasFlaggedItems } from '../../data/repository'
import { StatusPill } from '../ui/StatusPill'
import { getTemplate } from '../../data/templates/registry'

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function RecordSummaryRow({ record }: { record: ChecklistRecord }) {
  const flagged = hasFlaggedItems(record)
  const template = getTemplate(record.type)
  const Icon = record.type === 'generator' ? Zap : CircleGauge

  return (
    <Link
      to={`/records/${record.id}`}
      className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-surface-2 focus-visible:border-brand"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-text-muted">
        <Icon className="size-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text">{record.equipmentDescription}</p>
        </div>
        <p className="mt-0.5 truncate font-mono text-xs text-text-faint">
          {record.kksCode} · {template.shortLabel}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-sm text-text-muted">{record.doneBy}</p>
        <p className="font-mono text-xs text-text-faint tabular-nums">{formatDate(record.date)}</p>
      </div>

      <StatusPill status={record.status} flagged={flagged} className="shrink-0" />
      <ChevronRight className="hidden size-4 shrink-0 text-text-faint sm:block" aria-hidden="true" />
    </Link>
  )
}
