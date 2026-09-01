import { useId } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { Field, inputClasses } from '../ui/Field'

export interface TemplateReviewState {
  label: string
  description: string
  items: string[]
}

interface TemplateItemsEditorProps {
  review: TemplateReviewState
  onChange: (next: TemplateReviewState) => void
}

export function TemplateItemsEditor({ review, onChange }: TemplateItemsEditorProps) {
  const labelId = useId()
  const descriptionId = useId()

  const updateItem = (index: number, text: string) => {
    const items = [...review.items]
    items[index] = text
    onChange({ ...review, items })
  }

  const removeItem = (index: number) => {
    onChange({ ...review, items: review.items.filter((_, i) => i !== index) })
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= review.items.length) return
    const items = [...review.items]
    ;[items[index], items[target]] = [items[target], items[index]]
    onChange({ ...review, items })
  }

  const addItem = () => {
    onChange({ ...review, items: [...review.items, ''] })
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-text">Checklist Details</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Field label="Title" htmlFor={labelId} required>
            <input id={labelId} className={inputClasses} value={review.label} onChange={(e) => onChange({ ...review, label: e.target.value })} />
          </Field>
          <Field label="Description" htmlFor={descriptionId} hint="Optional — shown on the checklist type picker.">
            <textarea
              id={descriptionId}
              rows={2}
              className={`${inputClasses} min-h-16 resize-y py-2`}
              value={review.description}
              onChange={(e) => onChange({ ...review, description: e.target.value })}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Checklist Items</h2>
          <span className="text-xs text-text-faint">
            {review.items.length} item{review.items.length === 1 ? '' : 's'}
          </span>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {review.items.length === 0 && <p className="py-2 text-sm text-text-muted">No items yet — add them manually below.</p>}
          {review.items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-3 font-mono text-xs font-semibold text-text-faint">
                {index + 1}
              </span>
              <input
                className={`${inputClasses} flex-1`}
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                placeholder="Checklist item text"
              />
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  className="flex size-9 items-center justify-center rounded-lg text-text-faint hover:bg-surface-2 hover:text-text disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === review.items.length - 1}
                  className="flex size-9 items-center justify-center rounded-lg text-text-faint hover:bg-surface-2 hover:text-text disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="flex size-9 items-center justify-center rounded-lg text-text-faint hover:bg-critical/10 hover:text-critical"
                  aria-label="Remove item"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="mt-2 flex min-h-10 items-center gap-1.5 self-start rounded-lg border border-dashed border-border-strong px-3 text-sm font-medium text-text-muted hover:border-brand hover:text-brand-strong"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add item
          </button>
        </CardBody>
      </Card>
    </div>
  )
}
