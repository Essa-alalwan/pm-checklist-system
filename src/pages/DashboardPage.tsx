import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardList, FileClock, PlusCircle } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useSession } from '../context/SessionContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { getButtonClasses } from '../components/ui/buttonStyles'
import { RecordSummaryRow } from '../components/records/RecordSummaryRow'
import { useTemplates } from '../context/TemplatesContext'

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string
  value: number
  icon: typeof ClipboardList
  tone: 'brand' | 'flagged' | 'done'
  loading: boolean
}) {
  const toneClasses = {
    brand: 'text-brand-strong bg-brand-dim border-brand/30',
    flagged: 'text-flagged bg-flagged-dim border-flagged/30',
    done: 'text-done bg-done-dim border-done/30',
  }[tone]

  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg border ${toneClasses}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-faint">{label}</p>
          {loading ? (
            <Skeleton className="mt-1.5 h-7 w-12" />
          ) : (
            <p className="font-mono text-2xl font-semibold tabular-nums text-text">{value}</p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default function DashboardPage() {
  const { stats, recent, loading, error } = useDashboardStats()
  const { templates, loading: templatesLoading } = useTemplates()
  const { name } = useSession()
  const firstName = name.split(' ')[0]

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening across the electrical maintenance PM checklists."
        actions={
          <Link to="/checklists/new" className={getButtonClasses('primary', 'md')}>
            <PlusCircle className="size-4" aria-hidden="true" />
            New Checklist
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Records this week" value={stats?.recordsThisWeek ?? 0} icon={ClipboardList} tone="brand" loading={loading} />
        <StatTile
          label="Flagged, awaiting review"
          value={stats?.flaggedAwaitingReview ?? 0}
          icon={AlertTriangle}
          tone="flagged"
          loading={loading}
        />
        <StatTile label="Pending supervisor review" value={stats?.pendingReview ?? 0} icon={FileClock} tone="done" loading={loading} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Recent activity</h2>
            <Link to="/records" className="text-sm font-medium text-brand-strong hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <p className="text-sm text-critical">{error}</p>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No checklists yet"
              description="Start your first PM checklist and it will show up here."
              action={
                <Link to="/checklists/new" className={getButtonClasses('primary', 'md')}>
                  Start a checklist
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map((record) => (
                <RecordSummaryRow key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">Start a checklist</h2>
          <div className="flex flex-col gap-3">
            {templatesLoading ? (
              <>
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </>
            ) : (
              templates.map((template) => (
                <Link
                  key={template.type}
                  to={`/checklists/new/${template.type}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-colors hover:border-brand/50 hover:bg-surface-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-text">{template.shortLabel}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{template.items.length} checklist items</p>
                  </div>
                  <PlusCircle className="size-5 text-text-faint transition-colors group-hover:text-brand-strong" aria-hidden="true" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
