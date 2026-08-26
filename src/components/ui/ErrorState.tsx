import { AlertOctagon } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-critical/40 bg-critical-dim px-6 py-14 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full border border-critical/40 bg-critical/10 text-critical">
        <AlertOctagon className="size-6" aria-hidden="true" />
      </div>
      <p className="max-w-sm text-sm font-medium text-text">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
