import { useId } from 'react'
import type { ChecklistDraft } from '../../../features/wizard/draftFactory'
import { Card, CardBody, CardHeader } from '../../ui/Card'
import { inputClasses } from '../../ui/Field'
import { SignaturePad } from '../SignaturePad'

interface StepRemarksSignatureProps {
  draft: ChecklistDraft
  signatureError: string | null
  onChange: (patch: Partial<ChecklistDraft>) => void
}

export function StepRemarksSignature({ draft, signatureError, onChange }: StepRemarksSignatureProps) {
  const remarksId = useId()

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Remarks</h2>
        </CardHeader>
        <CardBody>
          <label htmlFor={remarksId} className="sr-only">
            Remarks
          </label>
          <textarea
            id={remarksId}
            rows={4}
            className={`${inputClasses} min-h-28 resize-y py-2.5`}
            placeholder="Any additional observations, actions taken, or follow-ups..."
            value={draft.remarks ?? ''}
            onChange={(e) => onChange({ remarks: e.target.value })}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Sign-off</h2>
        </CardHeader>
        <CardBody>
          <SignaturePad value={draft.signatureDataUrl} onChange={(dataUrl) => onChange({ signatureDataUrl: dataUrl })} />
          {signatureError && (
            <p role="alert" className="mt-2 text-xs font-medium text-critical">
              {signatureError}
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
