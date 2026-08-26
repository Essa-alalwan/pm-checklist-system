import type { ChecklistItemResult } from '../../../types/checklist'
import { ChecklistItemRow } from '../ChecklistItemRow'

interface StepChecklistItemsProps {
  items: ChecklistItemResult[]
  onChange: (items: ChecklistItemResult[]) => void
}

export function StepChecklistItems({ items, onChange }: StepChecklistItemsProps) {
  const updateItem = (index: number, next: ChecklistItemResult) => {
    const copy = [...items]
    copy[index] = next
    onChange(copy)
  }

  const flaggedCount = items.filter((i) => i.status === 'flagged').length
  const pendingCount = items.filter((i) => i.status === 'pending').length

  return (
    <div className="flex flex-col gap-3">
      {pendingCount > 0 && (
        <p className="text-sm font-medium text-text-muted">
          {pendingCount} item{pendingCount === 1 ? '' : 's'} still need{pendingCount === 1 ? 's' : ''} a status.
        </p>
      )}
      {flaggedCount > 0 && (
        <p className="text-sm font-medium text-flagged">
          {flaggedCount} item{flaggedCount === 1 ? '' : 's'} flagged — a note is required for each.
        </p>
      )}
      {items.map((item, index) => (
        <ChecklistItemRow key={item.id} index={index} item={item} onChange={(next) => updateItem(index, next)} />
      ))}
    </div>
  )
}
