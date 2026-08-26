import type { ReactNode } from 'react'
import { clsx } from 'clsx'
import { Check, CloudCheck, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { SaveState } from '../../../hooks/useDraft'

interface WizardStepDef {
  id: string
  label: string
}

interface WizardShellProps {
  title: string
  subtitle: string
  steps: WizardStepDef[]
  currentStepIndex: number
  saveState: SaveState
  onStepClick?: (index: number) => void
  footer: ReactNode
  children: ReactNode
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-text-faint">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Saving draft…
      </span>
    )
  }
  if (state === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-done">
        <CloudCheck className="size-3.5" aria-hidden="true" />
        Draft saved
      </span>
    )
  }
  return <span className="text-xs text-text-faint">&nbsp;</span>
}

export function WizardShell({ title, subtitle, steps, currentStepIndex, saveState, onStepClick, footer, children }: WizardShellProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col md:min-h-0">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Link to="/checklists/new" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-text-faint hover:text-text-muted">
            <X className="size-3.5" aria-hidden="true" />
            Cancel
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>
        </div>
        <SaveIndicator state={saveState} />
      </div>

      <ol className="mb-6 flex items-center gap-1.5" aria-label="Progress">
        {steps.map((step, index) => {
          const status = index < currentStepIndex ? 'done' : index === currentStepIndex ? 'current' : 'upcoming'
          return (
            <li key={step.id} className="flex flex-1 flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onStepClick?.(index)}
                disabled={!onStepClick || index > currentStepIndex}
                aria-current={status === 'current' ? 'step' : undefined}
                className={clsx(
                  'h-1.5 w-full rounded-full transition-colors',
                  status === 'done' && 'bg-done',
                  status === 'current' && 'bg-brand',
                  status === 'upcoming' && 'bg-surface-3',
                  onStepClick && index <= currentStepIndex && 'cursor-pointer',
                )}
              />
              <span
                className={clsx(
                  'hidden text-[11px] font-medium sm:flex sm:items-center sm:gap-1',
                  status === 'current' ? 'text-text' : 'text-text-faint',
                )}
              >
                {status === 'done' && <Check className="size-3" aria-hidden="true" />}
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="flex-1">{children}</div>

      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0">
        {footer}
      </div>
    </div>
  )
}
