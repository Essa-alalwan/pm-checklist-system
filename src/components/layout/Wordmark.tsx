import { clsx } from 'clsx'

export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="var(--color-surface-3)" />
        <circle cx="16" cy="16" r="10.5" fill="none" stroke="var(--color-brand)" strokeWidth="2" />
        <circle cx="16" cy="16" r="3" fill="var(--color-brand)" />
        <path
          d="M16 5.5V2.5M16 29.5V26.5M5.5 16H2.5M29.5 16H26.5"
          stroke="var(--color-brand)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <p className="font-mono text-sm font-semibold tracking-wide text-text">PM Logbook</p>
          <p className={clsx('text-[11px] text-text-faint')}>Aldur-2 Power &amp; Water Services</p>
        </div>
      )}
    </div>
  )
}
