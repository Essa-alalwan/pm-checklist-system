import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, PlusCircle, SearchX } from 'lucide-react'
import { useChecklists } from '../hooks/useChecklists'
import type { ChecklistFilters } from '../data/repository'
import { PageHeader } from '../components/ui/PageHeader'
import { FilterBar } from '../components/records/FilterBar'
import { RecordSummaryRow } from '../components/records/RecordSummaryRow'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { getButtonClasses } from '../components/ui/buttonStyles'

export default function RecordsPage() {
  const [filters, setFilters] = useState<ChecklistFilters>({ type: 'all' })
  const { records, loading, error, refetch } = useChecklists(filters)

  return (
    <div>
      <PageHeader
        title="Records"
        description="Search and review submitted PM checklists across the department."
        actions={
          <Link to="/checklists/new" className={getButtonClasses('primary', 'md')}>
            <PlusCircle className="size-4" aria-hidden="true" />
            New Checklist
          </Link>
        }
      />

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="mt-4 flex flex-col gap-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={filters.kksCode || filters.technician || filters.onlyFlagged ? SearchX : ClipboardList}
            title="No matching records"
            description="Try adjusting your filters, or start a new checklist for this equipment."
          />
        ) : (
          <>
            <p className="text-xs font-medium text-text-faint">
              {records.length} record{records.length === 1 ? '' : 's'}
            </p>
            {records.map((record) => (
              <RecordSummaryRow key={record.id} record={record} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
