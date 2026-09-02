import { Check, Table2, X } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import type { DetectedTableGroup } from '../../data/templatesApi'

interface TableSuggestionsPanelProps {
  tableGroups: DetectedTableGroup[]
  acceptedTableIndexes: Set<number>
  discardedTableIndexes: Set<number>
  onAccept: (group: DetectedTableGroup) => void
  onDiscard: (sourceTableIndex: number) => void
}

const CLASSIFICATION_LABEL: Record<DetectedTableGroup['classification'], string> = {
  grid: 'Fixed measurement grid',
  log: 'Open-ended log table',
  'skipped-reference': 'Looks like a reference table',
  'skipped-header': 'Looks like the standard job-info header',
  ambiguous: 'Not sure — needs a look',
}

const CLASSIFICATION_TONE: Record<DetectedTableGroup['classification'], string> = {
  grid: 'bg-brand/10 text-brand-strong',
  log: 'bg-brand/10 text-brand-strong',
  'skipped-reference': 'bg-surface-3 text-text-faint',
  'skipped-header': 'bg-surface-3 text-text-faint',
  ambiguous: 'bg-flagged/10 text-flagged',
}

function fieldCount(group: DetectedTableGroup): number | undefined {
  if (group.classification === 'grid') return group.measurementFields?.length
  if (group.classification === 'log') return group.logFields?.length
  return undefined
}

export function TableSuggestionsPanel({ tableGroups, acceptedTableIndexes, discardedTableIndexes, onAccept, onDiscard }: TableSuggestionsPanelProps) {
  if (tableGroups.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Table2 className="size-4 text-text-faint" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-text">Tables Found in the Document</h2>
      </div>
      <p className="text-xs text-text-faint">
        Nothing here is added automatically — review each table and accept it as a measurement grid or log table, or discard it.
      </p>
      {tableGroups.map((group) => {
        const accepted = acceptedTableIndexes.has(group.sourceTableIndex)
        const discarded = discardedTableIndexes.has(group.sourceTableIndex)
        const count = fieldCount(group)
        const canAccept = group.classification === 'grid' || group.classification === 'log'

        return (
          <Card key={group.sourceTableIndex} className={accepted || discarded ? 'opacity-60' : undefined}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text">{group.groupLabel}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CLASSIFICATION_TONE[group.classification]}`}>
                  {CLASSIFICATION_LABEL[group.classification]}
                  {count !== undefined ? ` · ${count} field${count === 1 ? '' : 's'}` : ''}
                </span>
                {accepted && <span className="text-xs font-medium text-brand-strong">Added to template</span>}
                {discarded && <span className="text-xs font-medium text-text-faint">Discarded</span>}
              </div>
              {!accepted && !discarded && (
                <div className="flex gap-2">
                  {canAccept && (
                    <button
                      type="button"
                      onClick={() => onAccept(group)}
                      className="flex min-h-8 items-center gap-1 rounded-lg border border-border-strong px-3 text-xs font-medium text-text hover:border-brand hover:text-brand-strong"
                    >
                      <Check className="size-3.5" aria-hidden="true" />
                      Accept
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDiscard(group.sourceTableIndex)}
                    className="flex min-h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-text-faint hover:bg-critical/10 hover:text-critical"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    Discard
                  </button>
                </div>
              )}
            </CardHeader>
            <CardBody>
              {group.previewRows.length === 0 ? (
                <p className="text-xs text-text-faint">No rows found in this table.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[320px] text-xs">
                    <tbody>
                      {group.previewRows.map((row, ri) => (
                        <tr key={ri} className="border-b border-border last:border-0">
                          {row.map((cellText, ci) => (
                            <td key={ci} className="whitespace-nowrap px-2 py-1 text-text-muted">
                              {cellText || <span className="text-text-faint">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
