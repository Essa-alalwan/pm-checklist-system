import { CircleGauge, ClipboardList, Zap } from 'lucide-react'
import type { ChecklistRecord } from '../../types/checklist'
import { BUILT_IN_CHECKLIST_TYPES } from '../../types/checklist'
import type { ChecklistDraft } from '../../features/wizard/draftFactory'
import { useTemplates } from '../../context/TemplatesContext'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { StatusPill } from '../ui/StatusPill'
import { FlaggedCallout } from './FlaggedCallout'
import { ChecklistItemsReadOnly } from './ChecklistItemsReadOnly'
import { MeasurementsView } from './MeasurementsView'

type DetailSource = ChecklistRecord | ChecklistDraft

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ChecklistDetailView({ record }: { record: DetailSource }) {
  const { getTemplate } = useTemplates()
  const template = getTemplate(record.type)
  const isBuiltIn = (BUILT_IN_CHECKLIST_TYPES as readonly string[]).includes(record.type)
  const hasMeasurements = isBuiltIn || (template?.measurementFields.length ?? 0) > 0 || (template?.logFields.length ?? 0) > 0
  const Icon = record.type === 'generator' ? Zap : record.type === 'lv-ac-motor' ? CircleGauge : ClipboardList
  const status = 'status' in record ? record.status : undefined
  const flagged = record.items.some((i) => i.status === 'flagged')

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-2 text-text-muted">
              <Icon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-faint">{template?.label ?? record.type}</p>
              <h2 className="text-lg font-semibold text-text">{record.equipmentDescription || 'Untitled equipment'}</h2>
              <p className="mt-0.5 font-mono text-sm text-text-muted">{record.kksCode || '—'}</p>
            </div>
          </div>
          {status && <StatusPill status={status} flagged={flagged} />}
        </CardBody>
      </Card>

      <FlaggedCallout items={record.items} />

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Sign-off Information</h2>
        </CardHeader>
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Prepared By</p>
            <p className="mt-0.5 text-sm text-text">{record.preparedBy || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Done By</p>
            <p className="mt-0.5 text-sm text-text">{record.doneBy || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Helpers</p>
            <p className="mt-0.5 font-mono text-sm text-text">{record.numberOfHelpers}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Date</p>
            <p className="mt-0.5 font-mono text-sm text-text">{formatDate(record.date)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Reviewed By</p>
            <p className="mt-0.5 text-sm text-text">{record.reviewedBy || <span className="text-text-faint">Pending review</span>}</p>
          </div>
          {record.reviewedAt && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-faint">Reviewed At</p>
              <p className="mt-0.5 font-mono text-sm text-text">{formatDateTime(record.reviewedAt)}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Checklist Items</h2>
        </CardHeader>
        <CardBody>
          <ChecklistItemsReadOnly items={record.items} />
        </CardBody>
      </Card>

      {hasMeasurements && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Measurements</h2>
          </CardHeader>
          <CardBody>
            <MeasurementsView source={record} measurementFields={template?.measurementFields} logFields={template?.logFields} />
          </CardBody>
        </Card>
      )}

      {record.remarks && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Remarks</h2>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm text-text-muted">{record.remarks}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Technician Signature</h2>
        </CardHeader>
        <CardBody>
          {record.signatureDataUrl ? (
            <img
              src={record.signatureDataUrl}
              alt={`Signature of ${record.doneBy || 'technician'}`}
              className="h-24 rounded-lg border border-border-strong bg-[#f7f5ef]"
            />
          ) : (
            <p className="text-sm text-text-faint">Not signed yet.</p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
