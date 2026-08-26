import { Link } from 'react-router-dom'
import { ArrowRight, CircleGauge, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardBody } from '../components/ui/Card'
import { checklistTemplates } from '../data/templates/registry'

const ICONS = { 'lv-ac-motor': CircleGauge, generator: Zap } as const

export default function NewChecklistTypePage() {
  return (
    <div>
      <PageHeader title="New Checklist" description="Choose the equipment type to start a preventive maintenance checklist." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {checklistTemplates.map((template) => {
          const Icon = ICONS[template.type]
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
    </div>
  )
}
