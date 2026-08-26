import { clsx } from 'clsx'
import type { ChecklistRecordStatus } from '../../types/checklist'

interface StatusPillProps {
  status: ChecklistRecordStatus
  flagged?: boolean
  className?: string
}

const CONFIG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  flagged: {
    label: 'Flagged',
    dot: 'bg-flagged shadow-[0_0_8px_var(--color-flagged)]',
    text: 'text-flagged',
    bg: 'bg-flagged-dim',
    border: 'border-flagged/40',
  },
  reviewed: {
    label: 'Reviewed',
    dot: 'bg-done shadow-[0_0_8px_var(--color-done)]',
    text: 'text-done',
    bg: 'bg-done-dim',
    border: 'border-done/40',
  },
  submitted: {
    label: 'Awaiting review',
    dot: 'bg-brand shadow-[0_0_8px_var(--color-brand)]',
    text: 'text-brand-strong',
    bg: 'bg-brand-dim',
    border: 'border-brand/40',
  },
}

export function StatusPill({ status, flagged, className }: StatusPillProps) {
  const key = flagged && status !== 'reviewed' ? 'flagged' : status
  const cfg = CONFIG[key]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide whitespace-nowrap',
        cfg.bg,
        cfg.text,
        cfg.border,
        className,
      )}
    >
      <span className={clsx('size-1.5 rounded-full', cfg.dot)} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
