import { useId } from 'react'
import type { ChecklistDraft } from '../../../features/wizard/draftFactory'
import type { JobInfoErrors } from '../../../features/wizard/validation'
import { Field, inputClasses, inputClassesWithError } from '../../ui/Field'
import { Card, CardBody } from '../../ui/Card'

interface StepJobInfoProps {
  draft: ChecklistDraft
  errors: JobInfoErrors
  onChange: (patch: Partial<ChecklistDraft>) => void
}

export function StepJobInfo({ draft, errors, onChange }: StepJobInfoProps) {
  const kksId = useId()
  const descId = useId()
  const dateId = useId()
  const preparedById = useId()
  const doneById = useId()
  const helpersId = useId()

  return (
    <Card>
      <CardBody className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="KKS Code" htmlFor={kksId} required error={errors.kksCode}>
            <input
              id={kksId}
              className={`${inputClassesWithError(!!errors.kksCode)} font-mono uppercase`}
              placeholder="e.g. 10MKA51AN001"
              value={draft.kksCode}
              onChange={(e) => onChange({ kksCode: e.target.value })}
            />
          </Field>

          <Field label="Date" htmlFor={dateId} required error={errors.date}>
            <input
              id={dateId}
              type="date"
              className={`${inputClassesWithError(!!errors.date)} font-mono`}
              value={draft.date}
              onChange={(e) => onChange({ date: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Equipment Description" htmlFor={descId} required error={errors.equipmentDescription}>
          <input
            id={descId}
            className={inputClassesWithError(!!errors.equipmentDescription)}
            placeholder="e.g. Cooling Water Pump Motor A"
            value={draft.equipmentDescription}
            onChange={(e) => onChange({ equipmentDescription: e.target.value })}
          />
        </Field>

        <div className="h-px bg-border" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Prepared By" htmlFor={preparedById} required error={errors.preparedBy} hint="Supervisor or planner who issued this checklist">
            <input
              id={preparedById}
              className={inputClassesWithError(!!errors.preparedBy)}
              value={draft.preparedBy}
              onChange={(e) => onChange({ preparedBy: e.target.value })}
            />
          </Field>

          <Field label="Done By" htmlFor={doneById} required error={errors.doneBy} hint="Technician who carried out the work">
            <input
              id={doneById}
              className={inputClassesWithError(!!errors.doneBy)}
              value={draft.doneBy}
              onChange={(e) => onChange({ doneBy: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Number of Helpers" htmlFor={helpersId} className="sm:w-48">
          <input
            id={helpersId}
            type="number"
            min={0}
            inputMode="numeric"
            className={`${inputClasses} font-mono`}
            value={draft.numberOfHelpers}
            onChange={(e) => onChange({ numberOfHelpers: Math.max(0, Number(e.target.value) || 0) })}
          />
        </Field>
      </CardBody>
    </Card>
  )
}
