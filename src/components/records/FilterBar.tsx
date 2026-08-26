import { useEffect, useId, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import type { ChecklistFilters } from '../../data/repository'
import { checklistTemplates } from '../../data/templates/registry'
import { inputClasses } from '../ui/Field'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

interface FilterBarProps {
  filters: ChecklistFilters
  onChange: (next: ChecklistFilters) => void
}

const EMPTY_FILTERS: ChecklistFilters = { type: 'all', kksCode: '', technician: '', dateFrom: '', dateTo: '', onlyFlagged: false }

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const kksId = useId()
  const techId = useId()
  const fromId = useId()
  const toId = useId()

  const [kksInput, setKksInput] = useState(filters.kksCode ?? '')
  const [techInput, setTechInput] = useState(filters.technician ?? '')
  const debouncedKks = useDebouncedValue(kksInput)
  const debouncedTech = useDebouncedValue(techInput)

  useEffect(() => {
    onChange({ ...filters, kksCode: debouncedKks })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKks])

  useEffect(() => {
    onChange({ ...filters, technician: debouncedTech })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTech])

  const reset = () => {
    setKksInput('')
    setTechInput('')
    onChange(EMPTY_FILTERS)
  }

  const hasActiveFilters =
    (filters.type && filters.type !== 'all') || filters.kksCode || filters.technician || filters.dateFrom || filters.dateTo || filters.onlyFlagged

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1.5 lg:col-span-1">
          <span className="text-xs font-medium text-text-muted">Equipment type</span>
          <select
            className={inputClasses}
            value={filters.type ?? 'all'}
            onChange={(e) => onChange({ ...filters, type: e.target.value as ChecklistFilters['type'] })}
          >
            <option value="all">All types</option>
            {checklistTemplates.map((t) => (
              <option key={t.type} value={t.type}>
                {t.shortLabel}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor={kksId} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">KKS code</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" aria-hidden="true" />
            <input
              id={kksId}
              className={`${inputClasses} pl-9 font-mono`}
              placeholder="e.g. 10MKA51"
              value={kksInput}
              onChange={(e) => setKksInput(e.target.value)}
            />
          </div>
        </label>

        <label htmlFor={techId} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Technician</span>
          <input
            id={techId}
            className={inputClasses}
            placeholder="Name"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
          />
        </label>

        <label htmlFor={fromId} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">From</span>
          <input
            id={fromId}
            type="date"
            className={`${inputClasses} font-mono`}
            value={filters.dateFrom ?? ''}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          />
        </label>

        <label htmlFor={toId} className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">To</span>
          <input
            id={toId}
            type="date"
            className={`${inputClasses} font-mono`}
            value={filters.dateTo ?? ''}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <label className="flex min-h-9 items-center gap-2 text-sm font-medium text-text-muted">
          <input
            type="checkbox"
            className="size-4 rounded border-border-strong accent-[color:var(--color-flagged)]"
            checked={filters.onlyFlagged ?? false}
            onChange={(e) => onChange({ ...filters, onlyFlagged: e.target.checked })}
          />
          Only flagged items
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-text-muted hover:text-text"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset filters
          </button>
        )}
      </div>
    </div>
  )
}
