import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FileQuestion, Save } from 'lucide-react'
import type { ChecklistRecord, ChecklistTemplate } from '../types/checklist'
import { BUILT_IN_CHECKLIST_TYPES } from '../types/checklist'
import { useTemplates } from '../context/TemplatesContext'
import { useChecklist } from '../hooks/useChecklist'
import { useSession } from '../context/SessionContext'
import { useUpdateChecklist } from '../hooks/useUpdateChecklist'
import type { ChecklistDraft, GeneratorDraft, LvAcMotorDraft } from '../features/wizard/draftFactory'
import { validateItems, validateJobInfo, validateSignature } from '../features/wizard/validation'
import { Button } from '../components/ui/Button'
import { WizardShell } from '../components/checklist/wizard/WizardShell'
import { StepJobInfo } from '../components/checklist/wizard/StepJobInfo'
import { StepChecklistItems } from '../components/checklist/wizard/StepChecklistItems'
import { StepMeasurementsLvAcMotor } from '../components/checklist/wizard/StepMeasurementsLvAcMotor'
import { StepMeasurementsGenerator } from '../components/checklist/wizard/StepMeasurementsGenerator'
import { StepMeasurementsGeneric } from '../components/checklist/wizard/StepMeasurementsGeneric'
import { StepRemarksSignature } from '../components/checklist/wizard/StepRemarksSignature'
import { StepReview } from '../components/checklist/wizard/StepReview'
import type { GenericDraft } from '../features/wizard/draftFactory'
import { Skeleton } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'

type StepId = 'job-info' | 'items' | 'measurements' | 'signoff' | 'review'

function buildSteps(hasMeasurements: boolean): { id: StepId; label: string }[] {
  const steps: { id: StepId; label: string }[] = [
    { id: 'job-info', label: 'Job Info' },
    { id: 'items', label: 'Checklist' },
  ]
  if (hasMeasurements) steps.push({ id: 'measurements', label: 'Measurements' })
  steps.push({ id: 'signoff', label: 'Sign-off' }, { id: 'review', label: 'Review' })
  return steps
}

// A record and its draft shape are identical apart from the fields the
// server owns (id/createdAt/status/createdByUserId) — strip those to reuse
// the same wizard steps/validation the "new checklist" flow already has.
function draftFromRecord(record: ChecklistRecord): ChecklistDraft {
  const { id: _id, createdAt: _createdAt, status: _status, createdByUserId: _createdByUserId, ...rest } = record
  return rest as ChecklistDraft
}

function EditChecklistInner({ record, template }: { record: ChecklistRecord; template: ChecklistTemplate }) {
  const navigate = useNavigate()
  const isBuiltIn = (BUILT_IN_CHECKLIST_TYPES as readonly string[]).includes(template.type)
  const hasMeasurements = isBuiltIn || template.measurementFields.length > 0 || template.logFields.length > 0
  const steps = useMemo(() => buildSteps(hasMeasurements), [hasMeasurements])
  const { submit, submitting, error: submitError } = useUpdateChecklist()

  const [step, setStep] = useState(0)
  const [data, setData] = useState<ChecklistDraft>(() => draftFromRecord(record))
  const [showErrors, setShowErrors] = useState(false)
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null)

  const currentStepId = steps[step].id

  const patchData = (patch: Partial<ChecklistDraft>) => {
    setData((prev) => ({ ...prev, ...patch }) as ChecklistDraft)
  }

  const jobInfoErrors = validateJobInfo(data)
  const itemsError = validateItems(data)
  const signatureError = validateSignature(data)

  const goToStep = (index: number) => {
    setBlockingMessage(null)
    setShowErrors(false)
    setStep(index)
  }

  const handleNext = () => {
    if (currentStepId === 'job-info' && Object.keys(jobInfoErrors).length > 0) {
      setShowErrors(true)
      return
    }
    if (currentStepId === 'items' && itemsError) {
      setBlockingMessage(itemsError.message)
      document.getElementById(`checklist-item-${itemsError.itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (currentStepId === 'signoff' && signatureError) {
      setBlockingMessage(signatureError)
      return
    }
    setBlockingMessage(null)
    setShowErrors(false)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const handleBack = () => {
    setBlockingMessage(null)
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    if (signatureError) {
      setBlockingMessage(signatureError)
      return
    }
    try {
      await submit(record.id, data)
      navigate(`/records/${record.id}`)
    } catch {
      // surfaced via submitError below
    }
  }

  return (
    <WizardShell
      title={`Edit — ${template.label}`}
      subtitle={template.description}
      steps={steps}
      currentStepIndex={step}
      saveState="idle"
      onStepClick={goToStep}
      footer={
        <div className="flex flex-col gap-2">
          {blockingMessage && (
            <p role="alert" className="text-sm font-medium text-critical">
              {blockingMessage}
            </p>
          )}
          {submitError && (
            <p role="alert" className="text-sm font-medium text-critical">
              {submitError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting}>
                <Save className="size-4" aria-hidden="true" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      }
    >
      {currentStepId === 'job-info' && <StepJobInfo draft={data} errors={showErrors ? jobInfoErrors : {}} onChange={patchData} />}
      {currentStepId === 'items' && <StepChecklistItems items={data.items} onChange={(items) => patchData({ items })} />}
      {currentStepId === 'measurements' &&
        (data.type === 'lv-ac-motor' ? (
          <StepMeasurementsLvAcMotor draft={data as LvAcMotorDraft} onChange={(patch) => patchData(patch)} />
        ) : data.type === 'generator' ? (
          <StepMeasurementsGenerator draft={data as GeneratorDraft} onChange={(patch) => patchData(patch)} />
        ) : (
          <StepMeasurementsGeneric
            measurementFields={template.measurementFields}
            measurements={(data as GenericDraft).measurements}
            onChange={(measurements) => patchData({ measurements } as Partial<ChecklistDraft>)}
            logFields={template.logFields}
            logs={(data as GenericDraft).logs}
            onLogsChange={(logs) => patchData({ logs } as Partial<ChecklistDraft>)}
          />
        ))}
      {currentStepId === 'signoff' && (
        <StepRemarksSignature draft={data} signatureError={blockingMessage ? signatureError : null} onChange={patchData} />
      )}
      {currentStepId === 'review' && <StepReview draft={data} />}
    </WizardShell>
  )
}

export default function EditChecklistPage() {
  const { id } = useParams<{ id: string }>()
  const { record, loading, error, notFound, refetch } = useChecklist(id)
  const { getTemplate, loading: templatesLoading } = useTemplates()
  const { role, userId } = useSession()

  if (loading || templatesLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (notFound || !record) {
    return <EmptyState icon={FileQuestion} title="Record not found" description="This checklist record may have been removed." />
  }

  const canEdit = (role === 'supervisor' || record.createdByUserId === userId) && record.status !== 'reviewed'
  if (!canEdit) {
    return <Navigate to={`/records/${record.id}`} replace />
  }

  const template = getTemplate(record.type)
  if (!template) {
    return <Navigate to={`/records/${record.id}`} replace />
  }

  return <EditChecklistInner key={record.id} record={record} template={template} />
}
