import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Send } from 'lucide-react'
import type { ChecklistTemplate, ChecklistType } from '../types/checklist'
import { useTemplates } from '../context/TemplatesContext'
import {
  createEmptyGeneratorDraft,
  createEmptyLvAcMotorDraft,
  type ChecklistDraft,
  type GeneratorDraft,
  type LvAcMotorDraft,
} from '../features/wizard/draftFactory'
import { validateItems, validateJobInfo, validateSignature } from '../features/wizard/validation'
import { useDraft } from '../hooks/useDraft'
import { useSession } from '../context/SessionContext'
import { useCreateChecklist } from '../hooks/useCreateChecklist'
import { Button } from '../components/ui/Button'
import { WizardShell } from '../components/checklist/wizard/WizardShell'
import { StepJobInfo } from '../components/checklist/wizard/StepJobInfo'
import { StepChecklistItems } from '../components/checklist/wizard/StepChecklistItems'
import { StepMeasurementsLvAcMotor } from '../components/checklist/wizard/StepMeasurementsLvAcMotor'
import { StepMeasurementsGenerator } from '../components/checklist/wizard/StepMeasurementsGenerator'
import { StepRemarksSignature } from '../components/checklist/wizard/StepRemarksSignature'
import { StepReview } from '../components/checklist/wizard/StepReview'

const STEPS = [
  { id: 'job-info', label: 'Job Info' },
  { id: 'items', label: 'Checklist' },
  { id: 'measurements', label: 'Measurements' },
  { id: 'signoff', label: 'Sign-off' },
  { id: 'review', label: 'Review' },
]

interface WizardState {
  step: number
  data: ChecklistDraft
}

function WizardInner({ template }: { template: ChecklistTemplate }) {
  const type = template.type
  const navigate = useNavigate()
  const { name } = useSession()
  const { submit, submitting, error: submitError } = useCreateChecklist()

  const initial = useMemo<WizardState>(
    () => ({
      step: 0,
      data: type === 'lv-ac-motor' ? createEmptyLvAcMotorDraft(template.items, name) : createEmptyGeneratorDraft(template.items, name),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type],
  )

  const { draft: state, setDraft: setState, saveState, clearDraft } = useDraft<WizardState>(`draft:${type}`, initial)
  const [showErrors, setShowErrors] = useState(false)
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null)

  const { step, data } = state

  const patchData = (patch: Partial<ChecklistDraft>) => {
    setState({ step, data: { ...data, ...patch } as ChecklistDraft })
  }

  const jobInfoErrors = validateJobInfo(data)
  const itemsError = validateItems(data)
  const signatureError = validateSignature(data)

  const goToStep = (index: number) => {
    setBlockingMessage(null)
    setShowErrors(false)
    setState({ step: index, data })
  }

  const handleNext = () => {
    if (step === 0 && Object.keys(jobInfoErrors).length > 0) {
      setShowErrors(true)
      return
    }
    if (step === 1 && itemsError) {
      setBlockingMessage(itemsError.message)
      document.getElementById(`checklist-item-${itemsError.itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (step === 3 && signatureError) {
      setBlockingMessage(signatureError)
      return
    }
    setBlockingMessage(null)
    setShowErrors(false)
    setState({ step: Math.min(step + 1, STEPS.length - 1), data })
  }

  const handleBack = () => {
    setBlockingMessage(null)
    setState({ step: Math.max(step - 1, 0), data })
  }

  const handleSubmit = async () => {
    if (signatureError) {
      setBlockingMessage(signatureError)
      return
    }
    try {
      const created = await submit(data)
      clearDraft()
      navigate(`/records/${created.id}`)
    } catch {
      // surfaced via submitError below
    }
  }

  return (
    <WizardShell
      title={template.label}
      subtitle={template.description}
      steps={STEPS}
      currentStepIndex={step}
      saveState={saveState}
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
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting}>
                <Send className="size-4" aria-hidden="true" />
                Submit Checklist
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 0 && <StepJobInfo draft={data} errors={showErrors ? jobInfoErrors : {}} onChange={patchData} />}
      {step === 1 && <StepChecklistItems items={data.items} onChange={(items) => patchData({ items })} />}
      {step === 2 &&
        (data.type === 'lv-ac-motor' ? (
          <StepMeasurementsLvAcMotor draft={data as LvAcMotorDraft} onChange={(patch) => patchData(patch)} />
        ) : (
          <StepMeasurementsGenerator draft={data as GeneratorDraft} onChange={(patch) => patchData(patch)} />
        ))}
      {step === 3 && <StepRemarksSignature draft={data} signatureError={blockingMessage ? signatureError : null} onChange={patchData} />}
      {step === 4 && <StepReview draft={data} />}
    </WizardShell>
  )
}

export default function NewChecklistWizardPage() {
  const { type } = useParams<{ type: string }>()
  const { getTemplate, loading } = useTemplates()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-border-strong border-t-brand" role="status" aria-label="Loading" />
      </div>
    )
  }

  const template = type ? getTemplate(type as ChecklistType) : undefined
  if (!template) {
    return <Navigate to="/checklists/new" replace />
  }

  return <WizardInner key={type} template={template} />
}
