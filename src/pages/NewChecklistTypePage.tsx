import { Link } from 'react-router-dom'
import { ArrowRight, CircleGauge, ClipboardList, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { useTemplates } from '../context/TemplatesContext'
import type { ChecklistType } from '../types/checklist'

const ICONS: Partial<Record<ChecklistType, typeof CircleGauge>> = { 'lv-ac-motor': CircleGauge, generator: Zap }

export default function NewChecklistTypePage() {
  const { templates, loading, error, refetch } = useTemplates()

  return (
    <div>
      <PageHeader title="New Checklist" description="Choose the equipment type to start a preventive maintenance checklist." />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates.map((template) => {
            const Icon = ICONS[template.type] ?? ClipboardList
            return (
              <Link key={template.type} to={`/checklists/new/${template.type}`} className="group block">
                <Card className="h-full transition-colors group-hover:border-brand/50 group-hover:bg-surface-2 group-focus-visible:border-brand">
                  <CardBody className="flex h-full flex-col gap-4">
                    <div className="flex size-12 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-brand-strong">
                      <Icon className="size-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-text">{template.label}</h2>
                      <p className="mt-1 text-sm text-text-muted">{template.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-faint">{template.items.length} checklist items</span>
                      <span className="flex items-center gap-1 font-medium text-brand-strong">
                        Start
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
