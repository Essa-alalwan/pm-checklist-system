import type { ChecklistDraft } from '../../../features/wizard/draftFactory'
import { ChecklistDetailView } from '../ChecklistDetailView'

export function StepReview({ draft }: { draft: ChecklistDraft }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">Review everything below before submitting. You can go back to any step to make changes.</p>
      <ChecklistDetailView record={draft} />
    </div>
  )
}
